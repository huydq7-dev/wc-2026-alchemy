import { Router } from 'express';
import { getMatchStats } from '../services/freeStats.js';

const router = Router();

// GET /api/free-stats/:matchId — proxy to wcstat.orangecloud.vn
router.get('/:matchId', async (req, res) => {
  try {
    const data = await getMatchStats(req.params.matchId);
    if (!data) {
      return res.status(404).json({ error: 'Stats not available for this match' });
    }
    res.json({ data, updated: new Date().toISOString() });
  } catch (err: any) {
    console.error('[freeStats] route error:', err.message);
    res.status(502).json({ error: 'Stats unavailable' });
  }
});

export default router;
