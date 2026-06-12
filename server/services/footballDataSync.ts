// Score sync from football-data.org (10 req/min free tier — 14,400 req/day)
// Primary source for World Cup 2026 match scores.
import db from '../db.js';
import { calculateResult, getEffectiveStatus } from '../gameLogic.js';
import { logActivity } from './activity.js';

const BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup
const API_KEY = process.env.FOOTBALL_DATA_KEY || '';

interface FDMatch {
  id: number;
  utcDate: string;
  status: string; // FINISHED | IN_PLAY | SCHEDULED | PAUSED | etc
  stage: string;
  group?: string;
  homeTeam: { id: number; name: string; shortName: string; tla: string };
  awayTeam: { id: number; name: string; shortName: string; tla: string };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

interface FDResponse {
  filters: Record<string, unknown>;
  resultSet: { count: number; first?: string; last?: string };
  matches: FDMatch[];
}

async function fetchFD<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${res.statusText}`);
  return res.json();
}

function fuzzyEq(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  return na === nb || na.includes(nb) || nb.includes(na);
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

function matchByCode(dbRow: any, fd: FDMatch): boolean {
  const dbA = (dbRow.team_a_code || '').toUpperCase();
  const dbB = (dbRow.team_b_code || '').toUpperCase();
  const fdA = fd.homeTeam.tla.toUpperCase();
  const fdB = fd.awayTeam.tla.toUpperCase();
  return dbA === fdA && dbB === fdB;
}

function matchByName(dbRow: any, fd: FDMatch): boolean {
  return (
    fuzzyEq(dbRow.team_a_name, fd.homeTeam.name) && fuzzyEq(dbRow.team_b_name, fd.awayTeam.name)
  );
}

async function updateMatchScore(
  dbm: any,
  scoreA: number,
  scoreB: number,
  fdId: number,
): Promise<string | null> {
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
    source: `football-data.org#${fdId}`,
  }).catch(() => {});

  return `${dbm.team_a_name} ${scoreA}-${scoreB} ${dbm.team_b_name}`;
}

export async function syncScoresFromFootballData(): Promise<{
  updated: number;
  details: string[];
}> {
  const details: string[] = [];
  let updated = 0;

  if (!API_KEY) {
    console.warn('[fdSync] No FOOTBALL_DATA_KEY — skipping');
    return { updated: 0, details: [] };
  }

  try {
    // 1. Find DB matches that need scores (past + no score)
    const dbMatches = (await db.execute('SELECT * FROM matches ORDER BY date, time')).rows as any[];

    const needsScore = dbMatches.filter((m: any) => {
      if (m.score_a != null && m.score_b != null) return false; // already has score
      const s = getEffectiveStatus(m.status, m.date, m.time);
      return s === 'finished'; // past match
    });

    if (needsScore.length === 0) return { updated: 0, details: [] };

    // 2. Determine date range (DB uses ICT UTC+7, API uses UTC — convert with ±1 day buffer)
    const dates = needsScore.map((m: any) => {
      // Convert ICT date to UTC date for API query
      const ictDate = new Date(`${m.date}T00:00:00+07:00`);
      return ictDate.toISOString().slice(0, 10);
    }).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    // Add ±1 day buffer to catch timezone edge cases
    const d = new Date(minDate);
    d.setUTCDate(d.getUTCDate() - 1);
    const dateFrom = d.toISOString().slice(0, 10);
    const d2 = new Date(maxDate);
    d2.setUTCDate(d2.getUTCDate() + 1);
    const dateTo = d2.toISOString().slice(0, 10);

    // 3. Fetch FINISHED matches from football-data.org
    const path = `/matches?competitions=${COMPETITION}&status=FINISHED&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    const data = await fetchFD<FDResponse>(path);
    const fdMatches = data.matches || [];

    // 4. Match and update
    for (const dbm of needsScore) {
      // Try exact team-code match first, then name match
      let fdm = fdMatches.find((m) => matchByCode(dbm, m));
      if (!fdm) fdm = fdMatches.find((m) => matchByName(dbm, m));
      if (!fdm) continue;

      const score = fdm.score?.fullTime;
      if (score?.home == null || score?.away == null) continue;

      const detail = await updateMatchScore(dbm, score.home, score.away, fdm.id);
      if (detail) {
        details.push(detail);
        updated++;
      }
    }
  } catch (err: any) {
    console.error('[fdSync] error:', err.message);
  }

  return { updated, details };
}

// ── Periodic runner ──

let syncTimer: ReturnType<typeof setInterval> | null = null;

export function startFDSync(intervalMs = 60_000): void {
  if (!API_KEY) {
    console.log('[fdSync] No FOOTBALL_DATA_KEY — sync disabled');
    return;
  }
  if (syncTimer) return;

  console.log('[fdSync] Started (every', intervalMs / 1000, 's) via football-data.org');

  // Run once immediately
  syncScoresFromFootballData().then((r) => {
    if (r.updated > 0) console.log('[fdSync] Initial:', r.updated, 'matches:', r.details.join(', '));
    else console.log('[fdSync] Initial: no matches needed scores');
  });

  syncTimer = setInterval(async () => {
    try {
      const r = await syncScoresFromFootballData();
      if (r.updated > 0) console.log('[fdSync]', r.updated, 'matches:', r.details.join(', '));
    } catch (err: any) {
      console.error('[fdSync] interval error:', err.message);
    }
  }, intervalMs);
  syncTimer.unref();
}

export function stopFDSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[fdSync] Stopped');
  }
}
