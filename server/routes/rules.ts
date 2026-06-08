import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const rules = db.prepare('SELECT * FROM rules ORDER BY sort_order').all();
  res.json(rules);
});

export default router;
