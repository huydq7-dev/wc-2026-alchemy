import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireSingleValue } from '../utils/request.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await db.execute('SELECT * FROM users ORDER BY name');
  res.json(result.rows);
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
