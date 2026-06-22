import { Router, Request, Response } from 'express';
import { syncFromWcstat } from '../services/wcstatSync.js';
import { syncScoresFromFootballData } from '../services/footballDataSync.js';
import { syncScoresFromOpenfootball } from '../services/scoreSync.js';

const router = Router();

// GET /api/cron/sync — called by Vercel Cron Job
// Non-destructive endpoint: only fetches scores from external APIs and updates DB.
// External APIs (wcstat, football-data.org) have their own rate limiting.
router.get('/sync', async (_req: Request, res: Response) => {
  const results: Record<string, { updated: number; details: string[] } | { error: string }> = {};

  // 1. wcstat (free, primary — includes live status + finished cascade)
  try {
    results.wcstat = await syncFromWcstat();
  } catch (err: any) {
    results.wcstat = { error: err.message || 'wcstat sync failed' };
  }

  // 2. football-data.org (API key required, primary score source)
  try {
    results.fd = await syncScoresFromFootballData();
  } catch (err: any) {
    results.fd = { error: err.message || 'fd sync failed' };
  }

  // 3. openfootball GitHub (free, backup — no rate limit)
  try {
    results.scores = await syncScoresFromOpenfootball();
  } catch (err: any) {
    results.scores = { error: err.message || 'openfootball sync failed' };
  }

  const totalUpdated = Object.values(results).reduce(
    (sum, r) => sum + ('updated' in r ? r.updated : 0),
    0,
  );

  console.log(`[cron] sync done — ${totalUpdated} matches updated`);

  res.json({ ok: true, results });
});

export default router;
