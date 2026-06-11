import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20));
  const action = req.query.action as string | undefined;
  const userId = req.query.userId as string | undefined;

  const conditions: string[] = [];
  const params: any[] = [];

  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.execute(
    `SELECT COUNT(*) as total FROM activity_log ${where}`,
    params,
  );
  const total = (countResult.rows[0] as any).total;

  const offset = (page - 1) * limit;
  const rows = (
    await db.execute(
      `SELECT * FROM activity_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )
  ).rows;

  const logs = rows.map((r: any) => ({
    ...r,
    created_at: r.created_at ? r.created_at.replace(' ', 'T') + '+07:00' : null,
  }));

  res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
});

export default router;
