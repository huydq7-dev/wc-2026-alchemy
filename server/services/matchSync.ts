// Auto-sync match results from Highlightly API to our database
import db from '../db.js';
import { calculateResult } from '../gameLogic.js';
import { logActivity } from './activity.js';
import { getMatches, getMatchDetail } from './liveData.js';

async function recalculateMatch(
  matchId: string,
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: 'A' | 'B',
) {
  const predictions = (
    await db.execute('SELECT * FROM predictions WHERE match_id = ? AND auto_loss = 0', [matchId])
  ).rows as any[];

  const stmts = predictions.map((pred: any) => {
    const result = calculateResult(scoreA, scoreB, deal, dealSide, pred.pick as 'A' | 'B');
    const points = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
    return {
      sql: 'UPDATE predictions SET result = ?, points = ? WHERE id = ?',
      args: [result, points, pred.id],
    };
  });

  if (stmts.length > 0) await db.batch(stmts, 'write');
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  return na.includes(nb) || nb.includes(na);
}

export async function syncMatchResults(): Promise<{ updated: number; details: string[] }> {
  const details: string[] = [];
  let updated = 0;

  try {
    // Fetch WC matches for today and yesterday in ICT (UTC+7)
    const ictNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const today = ictNow.toISOString().slice(0, 10);
    const yesterday = new Date(ictNow.getTime() - 86400000).toISOString().slice(0, 10);

    const allHLMatches = [...(await getMatches(today)), ...(await getMatches(yesterday))];

    // Get all our DB matches that aren't finished yet (or were recently finished)
    const dbMatches = (
      await db.execute("SELECT * FROM matches WHERE status != 'finished' OR status = 'finished'")
    ).rows as any[];

    for (const hl of allHLMatches) {
      const hlStatus = hl.status;

      // Only process finished matches from Highlightly
      if (hlStatus !== 'Finished') continue;

      // Find matching DB match by team names
      const dbMatch = dbMatches.find((m: any) => {
        return fuzzyMatch(m.team_a_name, hl.home) && fuzzyMatch(m.team_b_name, hl.away);
      });

      if (!dbMatch) continue;

      const hlScore = {
        home: parseInt(hl.home_score) || 0,
        away: parseInt(hl.away_score) || 0,
      };

      // Skip if Highlightly has no score data at all (null/undefined/empty string)
      if (hl.home_score == null || hl.home_score === '') continue;

      // Check if update is needed
      const scoreChanged = dbMatch.score_a !== hlScore.home || dbMatch.score_b !== hlScore.away;
      const statusChanged = dbMatch.status !== 'finished';

      if (!scoreChanged && !statusChanged) continue;

      // Get full detail for more accurate data
      let finalScore = hlScore;
      try {
        const detail = await getMatchDetail(hl.id);
        if (detail) {
          finalScore = {
            home: parseInt(detail.home_score) || hlScore.home,
            away: parseInt(detail.away_score) || hlScore.away,
          };
        }
      } catch {
        // Use score from match list
      }

      const deal = dbMatch.deal || '0';
      const dealSide: 'A' | 'B' =
        dbMatch.deal_side === 'A' || dbMatch.deal_side === 'B' ? dbMatch.deal_side : 'A';

      // Update match in DB
      await db.execute(
        "UPDATE matches SET status = 'finished', score_a = ?, score_b = ? WHERE id = ?",
        [finalScore.home, finalScore.away, dbMatch.id],
      );

      // Auto-loss for users who didn't predict
      const allUsers = (await db.execute('SELECT id, name FROM users')).rows as any[];
      const existingPreds = (
        await db.execute('SELECT user_id FROM predictions WHERE match_id = ?', [dbMatch.id])
      ).rows as any[];
      const predictedIds = new Set(existingPreds.map((p: any) => p.user_id));
      const missingUsers = allUsers.filter((u: any) => !predictedIds.has(u.id));

      if (missingUsers.length > 0) {
        await db.batch(
          missingUsers.map((u: any) => ({
            sql: "INSERT OR IGNORE INTO predictions (user_id, match_id, pick, result, points, auto_loss, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now', '+7 hours'))",
            args: [u.id, dbMatch.id, 'A', 'lose', -1],
          })),
          'write',
        );
        for (const u of missingUsers) {
          await logActivity('system', u.name, 'auto_loss', {
            matchId: dbMatch.id,
            match: `${dbMatch.team_a_name} vs ${dbMatch.team_b_name}`,
            reason: 'No prediction submitted (auto-sync)',
          }).catch(() => {});
        }
      }

      // Recalculate all predictions
      await recalculateMatch(dbMatch.id, finalScore.home, finalScore.away, deal, dealSide);

      // Log the sync
      await logActivity('system', 'System', 'update_result', {
        matchId: dbMatch.id,
        match: `${dbMatch.team_a_name} vs ${dbMatch.team_b_name}`,
        status: 'finished',
        score_a: finalScore.home,
        score_b: finalScore.away,
        source: 'highlightly-auto-sync',
      }).catch(() => {});

      details.push(
        `${dbMatch.team_a_name} ${finalScore.home}-${finalScore.away} ${dbMatch.team_b_name}`,
      );
      updated++;
    }
  } catch (err: any) {
    console.error('[matchSync] error:', err.message);
  }

  return { updated, details };
}

// Auto-sync every 5 minutes during tournament
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs = 300_000): void {
  if (syncInterval) return;
  console.log('[matchSync] Auto-sync started (every', intervalMs / 1000, 's)');
  syncInterval = setInterval(async () => {
    try {
      const result = await syncMatchResults();
      if (result.updated > 0) {
        console.log('[matchSync] Synced', result.updated, 'matches:', result.details.join(', '));
      }
    } catch (err: any) {
      console.error('[matchSync] sync error:', err.message);
    }
  }, intervalMs);
  syncInterval.unref();
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[matchSync] Auto-sync stopped');
  }
}
