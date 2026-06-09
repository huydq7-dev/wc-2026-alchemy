import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireSingleValue } from '../utils/request.js';

const BET_AMOUNT = 5000;
const PRIZE_PERCENTAGES = [40, 30, 20, 10];

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const users = (await db.execute('SELECT * FROM users')).rows as any[];
  const predictions = (await db.execute('SELECT * FROM predictions')).rows as any[];

  const userDebts = users.map(user => {
    const userPreds = predictions.filter(p => p.user_id === user.id);
    const losses = userPreds.filter(p => p.result === 'lose').length;
    const wins = userPreds.filter(p => p.result === 'win').length;
    const debt = losses * BET_AMOUNT;
    const totalPoints = wins - losses;
    return {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      losses,
      debt,
      paid: !!user.debt_paid,
      totalPoints,
    };
  });

  const totalFund = userDebts.reduce((sum, u) => sum + u.debt, 0);
  const paidCount = userDebts.filter(u => u.paid).length;
  const unpaidCount = userDebts.filter(u => !u.paid).length;

  // Prize distribution based on leaderboard ranking
  const ranked = [...userDebts].sort((a, b) => b.totalPoints - a.totalPoints);
  const prizes = PRIZE_PERCENTAGES.map((pct, i) => ({
    rank: i + 1,
    percentage: pct,
    amount: Math.round(totalFund * pct / 100),
    user: ranked[i] || null,
  }));

  const paidUsers = userDebts.filter(u => u.paid);
  const unpaidUsers = userDebts.filter(u => !u.paid).sort((a, b) => b.debt - a.debt);

  res.json({
    betAmount: BET_AMOUNT,
    totalFund,
    paidCount,
    unpaidCount,
    paidUsers,
    unpaidUsers,
    prizes,
  });
});

router.patch('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = requireSingleValue(req.params.id);
  const { paid } = req.body;

  const user = (await db.execute('SELECT * FROM users WHERE id = ?', [id])).rows[0] as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  await db.execute('UPDATE users SET debt_paid = ? WHERE id = ?', [paid ? 1 : 0, id]);
  const updated = (await db.execute('SELECT * FROM users WHERE id = ?', [id])).rows[0];
  res.json(updated);
});

export default router;
