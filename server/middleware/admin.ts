import { Request, Response, NextFunction } from 'express';
import db from '../db.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const user = (await db.execute({
    sql: 'SELECT is_admin FROM users WHERE id = ?',
    args: [userId],
  })).rows[0] as any;

  if (!user?.is_admin) return res.status(403).json({ error: 'Not authorized' });
  next();
}
