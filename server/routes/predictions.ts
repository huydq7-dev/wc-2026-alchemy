import { Router, Request, Response } from 'express';
import db from '../db.js';
import { isPickAllowed } from '../gameLogic.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { userId, matchId } = req.query;
  let query = 'SELECT * FROM predictions';
  const conditions: string[] = [];
  const params: string[] = [];

  if (userId) { conditions.push('user_id = ?'); params.push(userId as string); }
  if (matchId) { conditions.push('match_id = ?'); params.push(matchId as string); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at';

  const predictions = db.prepare(query).all(...params);
  res.json(predictions);
});

router.post('/', (req: Request, res: Response) => {
  const { userId, matchId, pick } = req.body;

  if (!userId || !matchId || !pick) {
    return res.status(400).json({ error: 'Missing required fields: userId, matchId, pick' });
  }
  if (pick !== 'A' && pick !== 'B') {
    return res.status(400).json({ error: 'Pick must be A or B' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status !== 'upcoming') return res.status(400).json({ error: 'Trận đấu đã bắt đầu hoặc kết thúc' });
  if (!isPickAllowed(match.date, match.time)) return res.status(400).json({ error: 'Đã hết thời gian đặt cược (deadline 17:30)' });

  const existing = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?').get(userId, matchId) as any;
  if (existing) {
    db.prepare('UPDATE predictions SET pick = ? WHERE id = ?').run(pick, existing.id);
  } else {
    db.prepare('INSERT INTO predictions (user_id, match_id, pick) VALUES (?, ?, ?)').run(userId, matchId, pick);
  }

  const prediction = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?').get(userId, matchId);
  res.status(existing ? 200 : 201).json(prediction);
});

router.get('/user/:userId/history', (req: Request, res: Response) => {
  const { userId } = req.params;
  const predictions = db.prepare(`
    SELECT p.*, m.date, m.time, m.team_a_name, m.team_a_flag, m.team_a_code, m.team_b_name, m.team_b_flag, m.team_b_code,
           m.deal, m.deal_side, m.stage, m.status, m.score_a, m.score_b
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.date DESC, m.time DESC
  `).all(userId);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN result IS NULL THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) - SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as totalPoints
    FROM predictions WHERE user_id = ?
  `).get(userId);

  res.json({ predictions, stats });
});

export default router;
