import { Router, Request, Response } from 'express';
import { syncMatches } from '../services/openfootball.js';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const result = await syncMatches();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

export default router;
