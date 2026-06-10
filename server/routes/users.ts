import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireSingleValue } from '../utils/request.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await db.execute('SELECT * FROM users ORDER BY name');
  res.json(result.rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = requireSingleValue(req.params.id);

  const user = (await db.execute('SELECT * FROM users WHERE id = ?', [id])).rows[0] as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Fetch data for all computations in one go
  const [userPredsResult, allPredsResult] = await Promise.all([
    db.execute(
      `SELECT p.*, m.date, m.time, m.team_a_name, m.team_a_flag, m.team_a_code,
              m.team_b_name, m.team_b_flag, m.team_b_code,
              m.deal, m.deal_side, m.stage, m.status, m.score_a, m.score_b
       FROM predictions p JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = ? ORDER BY m.date DESC, m.time DESC`, [id]),
    db.execute(
      `SELECT p.user_id, p.match_id, p.pick, p.result, p.points, m.deal_side, m.stage
       FROM predictions p JOIN matches m ON p.match_id = m.id`),
  ]);

  const preds = userPredsResult.rows as any[];
  const allPreds = allPredsResult.rows as any[];

  // --- Basic stats ---
  const wins = preds.filter(p => p.result === 'win').length;
  const losses = preds.filter(p => p.result === 'lose').length;
  const draws = preds.filter(p => p.result === 'draw').length;
  const pending = preds.filter(p => p.result === null).length;
  const totalPoints = wins - losses;
  const decided = wins + losses + draws;
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;
  const debt = losses * 5000;

  // --- Rank ---
  const userPoints = new Map<string, number>();
  for (const p of (await db.execute('SELECT user_id, result FROM predictions')).rows as any[]) {
    const pts = p.result === 'win' ? 1 : p.result === 'lose' ? -1 : 0;
    userPoints.set(p.user_id, (userPoints.get(p.user_id) || 0) + pts);
  }
  const sorted = [...userPoints.entries()].sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([uid]) => uid === id) + 1;
  const maxPoints = sorted.length > 0 ? Math.max(1, sorted[0][1]) : 1;

  // --- Recent form (last 5 decided) ---
  const decidedPreds = preds.filter(p => p.result !== null);
  const recentForm = decidedPreds.slice(0, 5).map(p =>
    p.result === 'win' ? 'W' : p.result === 'lose' ? 'L' : 'D'
  );

  // --- Streak ---
  let streak = 0;
  for (const p of decidedPreds) {
    if (p.result === 'win') {
      if (streak >= 0) streak++; else break;
    } else if (p.result === 'lose') {
      if (streak <= 0) streak--; else break;
    } else break;
  }

  // --- Favorite team ---
  const teamCount = new Map<string, { flag: string; count: number }>();
  for (const p of preds) {
    const team = p.pick === 'A' ? p.team_a_name : p.team_b_name;
    const flag = p.pick === 'A' ? p.team_a_flag : p.team_b_flag;
    const existing = teamCount.get(team);
    if (existing) existing.count++;
    else teamCount.set(team, { flag, count: 1 });
  }
  let favoriteTeam: { name: string; flag: string; count: number } | null = null;
  for (const [name, data] of teamCount) {
    if (!favoriteTeam || data.count > favoriteTeam.count) {
      favoriteTeam = { name, flag: data.flag, count: data.count };
    }
  }

  // --- Underdog rate ---
  let underdogPicks = 0;
  let picksWithDeal = 0;
  for (const p of preds) {
    if (!p.deal_side) continue;
    picksWithDeal++;
    if (p.pick !== p.deal_side) underdogPicks++;
  }
  const underdogRate = picksWithDeal > 0 ? Math.round((underdogPicks / picksWithDeal) * 100) : 0;

  // --- Best stage ---
  const stageStats = new Map<string, { wins: number; decided: number }>();
  for (const p of preds) {
    if (!p.result) continue;
    const s = stageStats.get(p.stage) || { wins: 0, decided: 0 };
    s.decided++;
    if (p.result === 'win') s.wins++;
    stageStats.set(p.stage, s);
  }
  let bestStage: string | null = null;
  let bestStageRate = -1;
  for (const [stage, s] of stageStats) {
    if (s.decided < 2) continue;
    const rate = s.wins / s.decided;
    if (rate > bestStageRate) { bestStageRate = rate; bestStage = stage; }
  }

  // --- Clutch rate ---
  const matchPickCounts = new Map<string, { a: number; b: number }>();
  for (const p of allPreds) {
    const m = matchPickCounts.get(p.match_id) || { a: 0, b: 0 };
    if (p.pick === 'A') m.a++; else m.b++;
    matchPickCounts.set(p.match_id, m);
  }
  let clutchWins = 0;
  let clutchTotal = 0;
  for (const p of preds) {
    if (p.result === null) continue;
    const m = matchPickCounts.get(p.match_id);
    if (!m) continue;
    const total = m.a + m.b;
    const sameSide = p.pick === 'A' ? m.a : m.b;
    const minority = sameSide / total < 0.5;
    if (minority) {
      clutchTotal++;
      if (p.result === 'win') clutchWins++;
    }
  }
  const clutchRate = clutchTotal > 0 ? Math.round((clutchWins / clutchTotal) * 100) : 0;

  // --- Biggest win ---
  let biggestWin: any = null;
  let smallestMinority = 100;
  for (const p of preds) {
    if (p.result !== 'win') continue;
    const m = matchPickCounts.get(p.match_id);
    if (!m) continue;
    const total = m.a + m.b;
    const sameSide = p.pick === 'A' ? m.a : m.b;
    const minorityPct = Math.round((sameSide / total) * 100);
    if (minorityPct < smallestMinority) {
      smallestMinority = minorityPct;
      const pickedTeam = p.pick === 'A' ? p.team_a_name : p.team_b_name;
      const pickedFlag = p.pick === 'A' ? p.team_a_flag : p.team_b_flag;
      biggestWin = { matchId: p.match_id, team_a_name: p.team_a_name, team_b_name: p.team_b_name,
        team_a_flag: p.team_a_flag, team_b_flag: p.team_b_flag,
        pickedTeam, pickedFlag, minorityPercent: minorityPct, date: p.date, stage: p.stage };
    }
  }

  res.json({
    user: { id: user.id, name: user.name, avatar: user.avatar, paid: !!user.paid, created_at: user.created_at },
    stats: { rank, totalPoints, wins, losses, draws, pendingBets: pending, totalBets: preds.length, winRate, debt, debtPaid: !!user.debt_paid, progressPercent: Math.max(0, Math.round((totalPoints / maxPoints) * 100)) },
    recentForm,
    streak,
    favoriteTeam,
    underdogRate,
    bestStage,
    clutchRate,
    biggestWin,
  });
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = requireSingleValue(req.params.id);
  const { paid } = req.body;

  const user = (await db.execute('SELECT * FROM users WHERE id = ?', [id])).rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  await db.execute('UPDATE users SET paid = ? WHERE id = ?', [paid ? 1 : 0, id]);
  const updated = (await db.execute('SELECT * FROM users WHERE id = ?', [id])).rows[0];
  res.json(updated);
});

export default router;
