import db from '../db.js';
import { calculateResult } from '../gameLogic.js';
import { logActivity } from './activity.js';

const SCHEDULE_URL = 'https://wcstat.orangecloud.vn/api/schedule?tournament=t-2026';

interface WcstatMatch {
  id: string;
  status: string;
  stage: string;
  group_code: string;
  home_short: string;
  away_short: string;
  home_score: number;
  away_score: number;
  minute: number;
  home_name: string;
  away_name: string;
  match_date: string;
  kickoff_utc: string;
  slug: string;
}

let cache: { data: WcstatMatch[]; ts: number } | null = null;
const CACHE_TTL = 60_000; // 1 min
let timer: ReturnType<typeof setInterval> | undefined;
let lastSuccessfulFetch = 0;

function toInternalId(m: WcstatMatch): string | null {
  if (m.stage === 'Group' && m.group_code) {
    return `Group-${m.group_code}-${m.home_short}-${m.away_short}`;
  }
  return null;
}

function mapStatus(s: string): string | null {
  switch (s) {
    case 'completed':
    case 'finished':
      return 'finished';
    case 'live':
    case 'in_progress':
    case '1H':
    case '2H':
    case 'HT':
      return 'live';
    default:
      return null;
  }
}

async function fetchSchedule(): Promise<WcstatMatch[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  const res = await fetch(SCHEDULE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`wcstat schedule ${res.status}`);

  const json = await res.json();
  const matches: WcstatMatch[] = [];
  const byDate = json.data?.byDate ?? {};
  for (const dateMatches of Object.values(byDate)) {
    matches.push(...(dateMatches as WcstatMatch[]));
  }

  cache = { data: matches, ts: Date.now() };
  lastSuccessfulFetch = Date.now();
  return matches;
}

export function isApiAvailable(): boolean {
  // Consider available if we had a successful fetch within the last 2 minutes
  return lastSuccessfulFetch > 0 && Date.now() - lastSuccessfulFetch < 120_000;
}

let lastAvailabilityCheck = 0;
let lastAvailabilityResult = false;
const AVAILABILITY_CACHE_MS = 30_000;

export async function checkApiAvailable(): Promise<boolean> {
  // Return cached result if fresh
  if (Date.now() - lastAvailabilityCheck < AVAILABILITY_CACHE_MS) {
    return lastAvailabilityResult;
  }

  try {
    const res = await fetch(SCHEDULE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    });
    lastAvailabilityResult = res.ok;
    if (res.ok) lastSuccessfulFetch = Date.now();
  } catch {
    lastAvailabilityResult = false;
  }

  lastAvailabilityCheck = Date.now();
  return lastAvailabilityResult;
}

async function recalculateAllPredictions(
  matchId: string,
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: 'A' | 'B',
) {
  const predictions = (
    await db.execute(
      'SELECT * FROM predictions WHERE match_id = ? AND auto_loss = 0',
      [matchId],
    )
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

async function handleFinishedMatch(matchId: string, scoreA: number, scoreB: number) {
  const match = (
    await db.execute('SELECT * FROM matches WHERE id = ?', [matchId])
  ).rows[0] as any;
  if (!match) return;

  const deal = match.deal as string;
  const dealSide = (match.deal_side as 'A' | 'B') || 'A';

  // Insert auto-loss for users who didn't predict
  const allUsers = (await db.execute('SELECT id, name FROM users')).rows as any[];
  const existingPreds = (
    await db.execute('SELECT user_id FROM predictions WHERE match_id = ?', [matchId])
  ).rows as any[];
  const predictedIds = new Set(existingPreds.map((p: any) => p.user_id));
  const missingUsers = allUsers.filter((u: any) => !predictedIds.has(u.id));

  if (missingUsers.length > 0) {
    await db.batch(
      missingUsers.map((u: any) => ({
        sql: "INSERT OR IGNORE INTO predictions (user_id, match_id, pick, result, points, auto_loss, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now', '+7 hours'))",
        args: [u.id, matchId, 'A', 'lose', -1],
      })),
      'write',
    );

    for (const u of missingUsers) {
      logActivity('wcstat_sync', u.name, 'auto_loss', {
        matchId,
        match: `${match.team_a_name} vs ${match.team_b_name}`,
        reason: 'No prediction submitted',
      }).catch(() => {});
    }
  }

  // Recalculate all non-auto_loss predictions
  await recalculateAllPredictions(matchId, scoreA, scoreB, deal, dealSide);
}

export async function syncFromWcstat(): Promise<{ updated: number; details: string[] }> {
  const details: string[] = [];
  let updated = 0;

  try {
    const matches = await fetchSchedule();

    for (const m of matches) {
      const internalId = toInternalId(m);
      if (!internalId) continue;

      const newStatus = mapStatus(m.status);
      if (!newStatus) continue;

      const existing = await db.execute({
        sql: 'SELECT status, score_a, score_b FROM matches WHERE id = ?',
        args: [internalId],
      });

      if (existing.rows.length === 0) continue;

      const row = existing.rows[0];
      const currentStatus = row.status as string;
      const currentScoreA = row.score_a as number | null;
      const currentScoreB = row.score_b as number | null;

      const newScoreA = m.home_score ?? currentScoreA;
      const newScoreB = m.away_score ?? currentScoreB;

      const statusChanged = currentStatus !== newStatus;
      const scoreChanged = currentScoreA !== newScoreA || currentScoreB !== newScoreB;

      // Update match if anything changed
      if (statusChanged || scoreChanged) {
        await db.execute({
          sql: 'UPDATE matches SET status = ?, score_a = ?, score_b = ? WHERE id = ?',
          args: [newStatus, newScoreA, newScoreB, internalId],
        });
      }

      // Cascade to predictions when scores are available and match is finished.
      // Run even if another sync already wrote score/status — predictions may
      // still be pending if that sync didn't cascade.
      if (newStatus === 'finished' && newScoreA != null && newScoreB != null) {
        const pending = await db.execute(
          'SELECT COUNT(*) as cnt FROM predictions WHERE match_id = ? AND result IS NULL AND auto_loss = 0',
          [internalId],
        );
        const hasPending = ((pending.rows[0] as any).cnt as number) > 0;
        if (hasPending || statusChanged || scoreChanged) {
          await handleFinishedMatch(internalId, newScoreA, newScoreB);
          if (hasPending && !statusChanged && !scoreChanged) {
            console.log(`[wcstatSync] fixed pending predictions for ${internalId}`);
          }
        }
      }

      if (!statusChanged && !scoreChanged) continue;

      updated++;
      details.push(
        `${internalId}: ${m.home_name} ${newScoreA}-${newScoreB} ${m.away_name} [${newStatus}]`,
      );

      // Log activity for the score change
      if (scoreChanged) {
        logActivity('wcstat_sync', 'WCStat Sync', 'sync_score', {
          matchId: internalId,
          match: `${m.home_name} vs ${m.away_name}`,
          score: `${newScoreA}-${newScoreB}`,
          status: newStatus,
        }).catch(() => {});
      }
    }

    return { updated, details };
  } catch (err: any) {
    console.error('[wcstatSync] error:', err.message);
    return { updated: 0, details: [err.message] };
  }
}

export function startWcstatSync(intervalMs: number = 60_000) {
  if (timer) return;

  const run = async () => {
    try {
      const result = await syncFromWcstat();
      if (result.updated > 0) {
        console.log(`[wcstatSync] updated ${result.updated} match(es)`);
        result.details.forEach((d) => console.log(`  ${d}`));
      }
    } catch {
      // syncFromWcstat already logs errors
    }
  };

  run();
  timer = setInterval(run, intervalMs);
  console.log(`[wcstatSync] Started (every ${intervalMs / 1000}s)`);
}

export function stopWcstatSync() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
