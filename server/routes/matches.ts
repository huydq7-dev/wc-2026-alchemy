import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateResult, isPickAllowed } from '../gameLogic.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { status, stage } = req.query;
  let query = 'SELECT * FROM matches';
  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status as string);
  }
  if (stage) {
    conditions.push('stage = ?');
    params.push(stage as string);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY date, time';

  const matches = db.prepare(query).all(...params);
  res.json(matches);
});

router.get('/next', (_req: Request, res: Response) => {
  const match = db.prepare(
    "SELECT * FROM matches WHERE status = 'upcoming' ORDER BY date, time LIMIT 1"
  ).get();
  res.json(match || null);
});

router.get('/:id', (req: Request, res: Response) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const predictions = db.prepare(`
    SELECT p.*, u.name, u.avatar FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.match_id = ?
  `).all(req.params.id);

  const dealInfo = generateDealExplanation(match);

  res.json({ ...match, predictions, dealInfo });
});

router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, score_a, score_b, deal, deal_side } = req.body;

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as any;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const newDeal = deal ?? match.deal;
  const newDealSide = deal_side ?? match.deal_side;

  db.prepare('UPDATE matches SET status = ?, score_a = ?, score_b = ?, deal = ?, deal_side = ? WHERE id = ?')
    .run(status || match.status, score_a ?? match.score_a, score_b ?? match.score_b, newDeal, newDealSide, id);

  // Recalculate predictions if match is finished
  if (status === 'finished' && score_a != null && score_b != null) {
    const predictions = db.prepare('SELECT * FROM predictions WHERE match_id = ?').all(id) as any[];
    const updatePred = db.prepare('UPDATE predictions SET result = ?, points = ? WHERE id = ?');

    for (const pred of predictions) {
      const result = calculateResult(score_a, score_b, match.deal, match.deal_side, pred.pick);
      const points = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
      updatePred.run(result, points, pred.id);
    }
  }

  res.json(db.prepare('SELECT * FROM matches WHERE id = ?').get(id));
});

router.get('/:id/pickable', (req: Request, res: Response) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as any;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const allowed = match.status === 'upcoming' && isPickAllowed(match.date, match.time);
  res.json({ pickable: allowed });
});

function generateDealExplanation(match: any) {
  if (match.score_a == null || match.score_b == null) return null;

  const dealValue = parseFloat(match.deal);
  const adjustedA = match.score_a + (match.deal_side === 'A' ? dealValue : 0);
  const adjustedB = match.score_b + (match.deal_side === 'B' ? dealValue : 0);

  const dealTeam = match.deal_side === 'A' ? match.team_a_name : match.team_b_name;

  let result: string;
  if (adjustedA > adjustedB) {
    result = `${match.team_a_name} thắng Deal (sau khi cộng ${match.deal})`;
  } else if (adjustedB > adjustedA) {
    result = `${match.team_b_name} thắng Deal (sau khi cộng ${match.deal})`;
  } else {
    result = `Hòa Deal`;
  }

  return {
    dealTeam,
    dealValue: match.deal,
    adjustedA,
    adjustedB,
    result,
    summary: `${match.team_a_name} ${match.score_a}-${match.score_b} ${match.team_b_name}. Deal ${match.deal} cho ${dealTeam}. → ${result}`,
  };
}

export default router;
