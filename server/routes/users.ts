import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await db.execute('SELECT * FROM users ORDER BY name');
  res.json(result.rows);
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paid } = req.body;

  const user = (await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] })).rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  await db.execute({ sql: 'UPDATE users SET paid = ? WHERE id = ?', args: [paid ? 1 : 0, id] });
  const updated = (await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] })).rows[0];
  res.json(updated);
});

export default router;
