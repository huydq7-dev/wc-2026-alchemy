import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

interface StandingRow {
  team: string;
  code: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

router.get('/', async (_req: Request, res: Response) => {
  const teams = (await db.execute('SELECT * FROM teams ORDER BY group_name')).rows as any[];
  const matches = (
    await db.execute(
      "SELECT * FROM matches WHERE stage = 'Group Stage' AND status = 'finished' AND score_a IS NOT NULL AND score_b IS NOT NULL",
    )
  ).rows as any[];

  // Init standings for all teams
  const map = new Map<string, StandingRow>();
  for (const t of teams) {
    map.set(t.name, {
      team: t.name,
      code: t.fifa_code,
      flag: t.flag_icon,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    });
  }

  // Calculate from finished matches
  for (const m of matches) {
    const a = map.get(m.team_a_name);
    const b = map.get(m.team_b_name);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.gf += m.score_a;
    a.ga += m.score_b;
    b.gf += m.score_b;
    b.ga += m.score_a;

    if (m.score_a > m.score_b) {
      a.won++;
      a.pts += 3;
      b.lost++;
    } else if (m.score_b > m.score_a) {
      b.won++;
      b.pts += 3;
      a.lost++;
    } else {
      a.drawn++;
      b.drawn++;
      a.pts += 1;
      b.pts += 1;
    }
  }

  for (const row of map.values()) {
    row.gd = row.gf - row.ga;
  }

  // Group by group_name and sort
  const groups: Record<string, StandingRow[]> = {};
  for (const t of teams) {
    const grp = t.group_name.replace('Group ', '');
    if (!groups[grp]) groups[grp] = [];
    const row = map.get(t.name);
    if (row) groups[grp].push(row);
  }

  for (const grp of Object.keys(groups)) {
    groups[grp].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  res.json({ groups });
});

export default router;
