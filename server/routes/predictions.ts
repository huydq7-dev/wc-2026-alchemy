import { Router, Request, Response } from 'express';
import db from '../db.js';
import { isPickAllowed } from '../gameLogic.js';
import { logActivity } from '../services/activity.js';
import { getSingleValue, isPick, requireSingleValue } from '../utils/request.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getSingleValue(req.query.userId);
    const matchId = getSingleValue(req.query.matchId);
    let query = 'SELECT * FROM predictions';
    const conditions: string[] = [];
    const params: string[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (matchId) {
      conditions.push('match_id = ?');
      params.push(matchId);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at';

    const result = await db.execute({ sql: query, args: params });
    res.json(result.rows);
  } catch (err: any) {
    console.error('[predictions] list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, matchId, pick } = req.body;

    if (!userId || !matchId || !pick) {
      return res.status(400).json({ error: 'Missing required fields: userId, matchId, pick' });
    }
    if (!isPick(pick)) {
      return res.status(400).json({ error: 'Pick must be A or B' });
    }

    const user = (await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] }))
      .rows[0] as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = (await db.execute({ sql: 'SELECT * FROM matches WHERE id = ?', args: [matchId] }))
      .rows[0] as any;
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'upcoming')
      return res.status(400).json({ error: 'Match has already started or finished' });
    if (!isPickAllowed(match.date, match.time))
      return res
        .status(400)
        .json({ error: 'Prediction deadline has passed (30 minutes before kickoff)' });

    const existing = (
      await db.execute({
        sql: 'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?',
        args: [userId, matchId],
      })
    ).rows[0] as any;
    if (existing) {
      await db.execute({
        sql: 'UPDATE predictions SET pick = ? WHERE id = ?',
        args: [pick, existing.id],
      });
    } else {
      await db.execute({
        sql: "INSERT INTO predictions (user_id, match_id, pick, created_at) VALUES (?, ?, ?, datetime('now', '+7 hours'))",
        args: [userId, matchId, pick],
      });
    }

    await logActivity(userId, user.name, existing ? 'change_prediction' : 'place_prediction', {
      matchId,
      pick,
      team: pick === 'A' ? match.team_a_name : match.team_b_name,
    });

    const prediction = (
      await db.execute({
        sql: 'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?',
        args: [userId, matchId],
      })
    ).rows[0];
    res.status(existing ? 200 : 201).json(prediction);
  } catch (err: any) {
    console.error('[predictions] create error:', err.message);
    res.status(500).json({ error: 'Failed to place prediction' });
  }
});

// Pick stats: { [matchId]: { a, b, total, aPct, bPct } }
router.get('/pick-stats', async (req: Request, res: Response) => {
  try {
    const matchIds = getSingleValue(req.query.matchIds);
    if (!matchIds) return res.json({});

    const ids = matchIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return res.json({});

    const placeholders = ids.map(() => '?').join(',');
    const rows = (
      await db.execute(
        `SELECT match_id, pick, COUNT(*) as count
       FROM predictions WHERE match_id IN (${placeholders})
       GROUP BY match_id, pick`,
        ids,
      )
    ).rows as any[];

    const result: Record<
      string,
      { a: number; b: number; total: number; aPct: number; bPct: number }
    > = {};
    for (const id of ids) result[id] = { a: 0, b: 0, total: 0, aPct: 0, bPct: 0 };

    for (const row of rows) {
      const m = result[row.match_id as string];
      if (!m) continue;
      if (row.pick === 'A') m.a = row.count as number;
      else if (row.pick === 'B') m.b = row.count as number;
    }

    for (const id of ids) {
      const m = result[id];
      m.total = m.a + m.b;
      m.aPct = m.total > 0 ? Math.round((m.a / m.total) * 100) : 0;
      m.bPct = m.total > 0 ? Math.round((m.b / m.total) * 100) : 0;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[predictions] pick-stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pick stats' });
  }
});

router.get('/user/:userId/history', async (req: Request, res: Response) => {
  try {
    const userId = requireSingleValue(req.params.userId);
    const predictions = (
      await db.execute(
        `SELECT p.*, m.date, m.time, m.team_a_name, m.team_a_flag, m.team_a_code, m.team_b_name, m.team_b_flag, m.team_b_code,
             m.deal, m.deal_side, m.stage, m.status, m.score_a, m.score_b
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ?
      ORDER BY m.date DESC, m.time DESC`,
        [userId],
      )
    ).rows;

    const stats = (
      await db.execute(
        `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN result IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) - SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as totalPoints
      FROM predictions WHERE user_id = ?`,
        [userId],
      )
    ).rows[0];

    res.json({ predictions, stats });
  } catch (err: any) {
    console.error('[predictions] history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user history' });
  }
});

export default router;
