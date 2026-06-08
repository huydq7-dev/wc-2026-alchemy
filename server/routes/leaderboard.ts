import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT * FROM users').all() as any[];
  const predictions = db.prepare('SELECT * FROM predictions').all() as any[];

  const entries = users.map(user => {
    const userPreds = predictions.filter(p => p.user_id === user.id);
    const wins = userPreds.filter(p => p.result === 'win').length;
    const losses = userPreds.filter(p => p.result === 'lose').length;
    const draws = userPreds.filter(p => p.result === 'draw').length;
    const pending = userPreds.filter(p => p.result === null).length;
    const totalPoints = wins - losses;
    const debt = losses * 5000;

    return {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      totalPoints,
      wins,
      losses,
      draws,
      pendingBets: pending,
      totalBets: userPreds.length,
      debt,
      debtPaid: !!user.debt_paid,
      winRate: userPreds.filter(p => p.result !== null).length > 0
        ? Math.round((wins / (wins + losses + draws)) * 100)
        : 0,
    };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints);

  const maxPoints = entries.length > 0 ? Math.max(1, entries[0].totalPoints) : 1;

  const ranked = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    progressPercent: Math.max(0, Math.round((entry.totalPoints / maxPoints) * 100)),
  }));

  res.json({ entries: ranked, maxPoints });
});

export default router;
