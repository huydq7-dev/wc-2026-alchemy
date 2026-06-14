import { Router, Request, Response } from 'express';
import { syncMatches } from '../services/openfootball.js';
import { syncMatchResults } from '../services/matchSync.js';
import { syncScoresFromOpenfootball } from '../services/scoreSync.js';
import { syncScoresFromFootballData } from '../services/footballDataSync.js';
import { syncFromWcstat, checkApiAvailable } from '../services/wcstatSync.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.post('/', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncMatches();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/matches/sync/fd — football-data.org score sync (10 req/min, primary)
router.post('/fd', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncScoresFromFootballData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/matches/sync/scores — openfootball score sync (GitHub, backup)
router.post('/scores', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncScoresFromOpenfootball();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/matches/sync/results — Highlightly score sync (uses API quota)
router.post('/results', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncMatchResults();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/matches/sync/wcstat — free wcstat.orangecloud.vn score sync
router.post('/wcstat', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncFromWcstat();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// GET /api/matches/sync/wcstat/status — check if wcstat sync is available
router.get('/wcstat/status', async (_req: Request, res: Response) => {
  const available = await checkApiAvailable();
  res.json({ available });
});

export default router;
