import { Router, Request, Response } from 'express';
import squads from '../services/squadData.js';

const router = Router();

// GET /api/teams - list all teams (for navigation)
router.get('/', async (_req: Request, res: Response) => {
  const teams = squads.map((s) => ({
    code: s.teamCode,
    name: s.teamName,
    flag: s.flag,
    group: s.group,
    playerCount: s.players.length,
  }));
  res.json({ teams });
});

// GET /api/teams/:code/squad
router.get('/:code/squad', async (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  const squad = squads.find((s) => s.teamCode === code);

  if (!squad) {
    res.status(404).json({ error: 'Squad not found' });
    return;
  }

  res.json({ squad });
});

export default router;
