import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

const ROUND_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third Place',
  'Final',
];

router.get('/', (_req: Request, res: Response) => {
  const matches = db.prepare(
    "SELECT * FROM matches WHERE stage != 'Group Stage' ORDER BY id"
  ).all() as any[];

  const rounds: { name: string; matches: any[] }[] = [];

  for (const name of ROUND_ORDER) {
    const roundMatches = matches.filter((m: any) => m.stage === name);
    if (roundMatches.length > 0) {
      rounds.push({
        name,
        matches: roundMatches.map((m: any) => ({
          id: m.id,
          date: m.date,
          time: m.time,
          team_a: { name: m.team_a_name, code: m.team_a_code, flag: m.team_a_flag },
          team_b: { name: m.team_b_name, code: m.team_b_code, flag: m.team_b_flag },
          score_a: m.score_a,
          score_b: m.score_b,
          venue: m.venue,
          status: m.status,
        })),
      });
    }
  }

  res.json({ rounds });
});

export default router;
