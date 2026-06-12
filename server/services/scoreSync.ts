// Lightweight score sync from openfootball GitHub (free, no rate limit)
// Only updates past matches that are missing scores — skips everything else.
import db from '../db.js';
import { calculateResult, getEffectiveStatus } from '../gameLogic.js';
import { logActivity } from './activity.js';

const SCORE_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

interface OFMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  num?: number;
  score1?: number;
  score2?: number;
}

function fuzzyEq(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  return na === nb || na.includes(nb) || nb.includes(na);
}

function generateOfId(m: OFMatch): string {
  if (m.num != null) return `KO-${m.num}`;
  const grp = (m.group || 'XX').replace(' ', '-');
  const c1 = m.team1.slice(0, 3).toUpperCase();
  const c2 = m.team2.slice(0, 3).toUpperCase();
  return `${grp}-${c1}-${c2}`;
}

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

export async function syncScoresFromOpenfootball(): Promise<{
  updated: number;
  details: string[];
}> {
  const details: string[] = [];
  let updated = 0;

  try {
    // 1. Find DB matches that are past + no score (the only ones we care about)
    const dbMatches = (await db.execute('SELECT * FROM matches ORDER BY date, time')).rows as any[];

    const needsScore = dbMatches.filter((m: any) => {
      if (m.score_a != null && m.score_b != null) return false; // already has score
      const s = getEffectiveStatus(m.status, m.date, m.time);
      return s === 'finished'; // past match, no score yet
    });

    if (needsScore.length === 0) return { updated: 0, details: [] };

    // 2. Fetch openfootball data (single request for all matches)
    const res = await fetch(SCORE_URL);
    if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`);
    const data = (await res.json()) as { matches: OFMatch[] };
    const ofMatches: OFMatch[] = data.matches || [];

    // 3. Build lookup: by generated ID + by team names
    const byId = new Map<string, OFMatch>();
    for (const m of ofMatches) {
      if (m.score1 != null && m.score2 != null) {
        byId.set(generateOfId(m), m);
      }
    }

    // 4. Match and update
    for (const dbm of needsScore) {
      // Try exact ID match first
      let ofm = byId.get(dbm.id);

      // Fallback: fuzzy team-name match within same candidate pool
      if (!ofm) {
        for (const [, m] of byId) {
          if (fuzzyEq(m.team1, dbm.team_a_name) && fuzzyEq(m.team2, dbm.team_b_name)) {
            ofm = m;
            break;
          }
        }
      }

      if (!ofm || ofm.score1 == null || ofm.score2 == null) continue;

      const scoreA = ofm.score1;
      const scoreB = ofm.score2;
      const deal = dbm.deal || '0';
      const dealSide: 'A' | 'B' =
        dbm.deal_side === 'A' || dbm.deal_side === 'B' ? dbm.deal_side : 'A';

      await db.execute(
        "UPDATE matches SET status = 'finished', score_a = ?, score_b = ? WHERE id = ?",
        [scoreA, scoreB, dbm.id],
      );

      // Auto-loss for users who didn't predict
      const allUsers = (await db.execute('SELECT id, name FROM users')).rows as any[];
      const existingPreds = (
        await db.execute('SELECT user_id FROM predictions WHERE match_id = ?', [dbm.id])
      ).rows as any[];
      const predictedIds = new Set(existingPreds.map((p: any) => p.user_id));
      const missingUsers = allUsers.filter((u: any) => !predictedIds.has(u.id));

      if (missingUsers.length > 0) {
        await db.batch(
          missingUsers.map((u: any) => ({
            sql: "INSERT OR IGNORE INTO predictions (user_id, match_id, pick, result, points, auto_loss, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now', '+7 hours'))",
            args: [u.id, dbm.id, 'A', 'lose', -1],
          })),
          'write',
        );
      }

      await recalculateMatch(dbm.id, scoreA, scoreB, deal, dealSide);

      await logActivity('system', 'System', 'update_result', {
        matchId: dbm.id,
        match: `${dbm.team_a_name} vs ${dbm.team_b_name}`,
        status: 'finished',
        score_a: scoreA,
        score_b: scoreB,
        source: 'openfootball-auto-sync',
      }).catch(() => {});

      details.push(`${dbm.team_a_name} ${scoreA}-${scoreB} ${dbm.team_b_name}`);
      updated++;
    }
  } catch (err: any) {
    console.error('[scoreSync] error:', err.message);
  }

  return { updated, details };
}

// ── Periodic runner ──

let syncTimer: ReturnType<typeof setInterval> | null = null;

export function startScoreSync(intervalMs = 300_000): void {
  if (syncTimer) return;
  console.log('[scoreSync] Started (every', intervalMs / 1000, 's) from openfootball');

  // Run once immediately
  syncScoresFromOpenfootball().then((r) => {
    if (r.updated > 0) console.log('[scoreSync] Initial:', r.updated, 'matches updated');
  });

  syncTimer = setInterval(async () => {
    try {
      const r = await syncScoresFromOpenfootball();
      if (r.updated > 0) console.log('[scoreSync]', r.updated, 'matches:', r.details.join(', '));
    } catch (err: any) {
      console.error('[scoreSync] interval error:', err.message);
    }
  }, intervalMs);
  syncTimer.unref();
}

export function stopScoreSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[scoreSync] Stopped');
  }
}
