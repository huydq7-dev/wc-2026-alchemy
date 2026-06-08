import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { userId, pin } = req.body;

  if (!userId || !pin) {
    return res.status(400).json({ error: 'Vui lòng nhập userId và PIN' });
  }

  const user = db.prepare('SELECT id, name, avatar, pin, paid, debt_paid FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    return res.status(401).json({ error: 'Người dùng không tồn tại' });
  }

  if (user.pin !== pin) {
    return res.status(401).json({ error: 'Sai PIN. Vui lòng thử lại.' });
  }

  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    paid: !!user.paid,
    debtPaid: !!user.debt_paid,
  });
});

export default router;
