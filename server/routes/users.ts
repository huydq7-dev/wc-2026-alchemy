import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT * FROM users ORDER BY name').all();
  res.json(users);
});

router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paid } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET paid = ? WHERE id = ?').run(paid ? 1 : 0, id);
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
});

export default router;
