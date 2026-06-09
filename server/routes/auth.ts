import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { userId, pin } = req.body;

  if (!userId || !pin) {
    return res.status(400).json({ error: 'Please enter userId and PIN' });
  }

  const result = await db.execute({
    sql: 'SELECT id, name, avatar, pin, paid, debt_paid, is_admin, pin_changed FROM users WHERE id = ?',
    args: [userId],
  });
  const user = result.rows[0] as any;

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (user.pin !== pin) {
    return res.status(401).json({ error: 'Wrong PIN. Please try again.' });
  }

  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    paid: !!user.paid,
    debtPaid: !!user.debt_paid,
    isAdmin: !!user.is_admin,
    pinChanged: !!user.pin_changed,
  });
});

router.post('/change-pin', async (req: Request, res: Response) => {
  const { userId, oldPin, newPin } = req.body;

  if (!userId || !oldPin || !newPin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (newPin.length < 4) {
    return res.status(400).json({ error: 'New PIN must be at least 4 digits' });
  }

  const user = (await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  })).rows[0] as any;

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.pin !== oldPin) return res.status(401).json({ error: 'Wrong current PIN' });

  await db.execute({
    sql: 'UPDATE users SET pin = ?, pin_changed = 1 WHERE id = ?',
    args: [newPin, userId],
  });

  res.json({ success: true, message: 'PIN changed successfully' });
});

router.post('/reset-pin', requireAdmin, async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const user = (await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  })).rows[0] as any;

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Default PIN based on user ID pattern: last 4 chars of ID or "1234"
  const defaultPin = String(userId).slice(-4).padStart(4, '0');

  await db.execute({
    sql: 'UPDATE users SET pin = ?, pin_changed = 0 WHERE id = ?',
    args: [defaultPin, userId],
  });

  res.json({ success: true, message: `PIN reset to default for ${user.name}` });
});

export default router;
