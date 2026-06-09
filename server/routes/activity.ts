import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const logs = (await db.execute(
    'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100'
  )).rows;
  res.json(logs);
});

export default router;
