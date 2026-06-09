import { Router, Request, Response } from 'express';
import db from '../db.js';
import { isPickAllowed } from '../gameLogic.js';
import { logActivity } from '../services/activity.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { userId, matchId } = req.query;
  let query = 'SELECT * FROM predictions';
  const conditions: string[] = [];
  const params: string[] = [];

  if (userId) { conditions.push('user_id = ?'); params.push(userId as string); }
  if (matchId) { conditions.push('match_id = ?'); params.push(matchId as string); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at';

  const result = await db.execute({ sql: query, args: params });
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { userId, matchId, pick } = req.body;

  if (!userId || !matchId || !pick) {
    return res.status(400).json({ error: 'Missing required fields: userId, matchId, pick' });
  }
  if (pick !== 'A' && pick !== 'B') {
    return res.status(400).json({ error: 'Pick must be A or B' });
  }

  const user = (await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] })).rows[0] as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = (await db.execute({ sql: 'SELECT * FROM matches WHERE id = ?', args: [matchId] })).rows[0] as any;
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status !== 'upcoming') return res.status(400).json({ error: 'Match has already started or finished' });
  if (!isPickAllowed(match.date, match.time)) return res.status(400).json({ error: 'Prediction deadline has passed (17:30)' });

  const existing = (await db.execute({ sql: 'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?', args: [userId, matchId] })).rows[0] as any;
  if (existing) {
    await db.execute({ sql: 'UPDATE predictions SET pick = ? WHERE id = ?', args: [pick, existing.id] });
  } else {
    await db.execute({ sql: 'INSERT INTO predictions (user_id, match_id, pick) VALUES (?, ?, ?)', args: [userId, matchId, pick] });
  }

  await logActivity(userId, user.name, existing ? 'change_prediction' : 'place_prediction', {
    matchId,
    pick,
    team: pick === 'A' ? match.team_a_name : match.team_b_name,
  });

  const prediction = (await db.execute({ sql: 'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?', args: [userId, matchId] })).rows[0];
  res.status(existing ? 200 : 201).json(prediction);
});

router.get('/user/:userId/history', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const predictions = (await db.execute({
    sql: `
    SELECT p.*, m.date, m.time, m.team_a_name, m.team_a_flag, m.team_a_code, m.team_b_name, m.team_b_flag, m.team_b_code,
           m.deal, m.deal_side, m.stage, m.status, m.score_a, m.score_b
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.date DESC, m.time DESC
  `,
    args: [userId],
  })).rows;

  const stats = (await db.execute({
    sql: `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN result IS NULL THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) - SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as totalPoints
    FROM predictions WHERE user_id = ?
  `,
    args: [userId],
  })).rows[0];

  res.json({ predictions, stats });
});

export default router;
