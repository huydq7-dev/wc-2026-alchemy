import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateResult, isPickAllowed } from '../gameLogic.js';
import { requireAdmin } from '../middleware/admin.js';
import { logActivity } from '../services/activity.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
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

  const result = await db.execute(query, params);
  res.json(result.rows);
});

router.get('/next', async (_req: Request, res: Response) => {
  const result = await db.execute(
    "SELECT * FROM matches WHERE status = 'upcoming' ORDER BY date, time LIMIT 1"
  );
  res.json(result.rows[0] || null);
});

router.get('/:id', async (req: Request, res: Response) => {
  const match = (await db.execute('SELECT * FROM matches WHERE id = ?', [req.params.id])).rows[0];
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const predictions = (await db.execute(
    `SELECT p.*, u.name, u.avatar FROM predictions p
     JOIN users u ON p.user_id = u.id
     WHERE p.match_id = ?`,
    [req.params.id],
  )).rows;

  const dealInfo = generateDealExplanation(match);

  res.json({ ...match, predictions, dealInfo });
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, score_a, score_b, deal, deal_side } = req.body;
  const adminId = req.headers['x-user-id'] as string;

  const match = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0] as any;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const newDeal = deal ?? match.deal;
  const newDealSide = deal_side ?? match.deal_side;

  await db.execute(
    'UPDATE matches SET status = ?, score_a = ?, score_b = ?, deal = ?, deal_side = ? WHERE id = ?',
    [status || match.status, score_a ?? match.score_a, score_b ?? match.score_b, newDeal, newDealSide, id],
  );

  // Recalculate predictions if match is finished
  if (status === 'finished' && score_a != null && score_b != null) {
    const predictions = (await db.execute('SELECT * FROM predictions WHERE match_id = ?', [id])).rows as any[];

    const updateStmts = predictions.map((pred: any) => {
      const result = calculateResult(score_a, score_b, match.deal, match.deal_side, pred.pick);
      const points = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
      return {
        sql: 'UPDATE predictions SET result = ?, points = ? WHERE id = ?',
        args: [result, points, pred.id],
      };
    });

    if (updateStmts.length > 0) {
      await db.batch(updateStmts, 'write');
    }
  }

  // Log admin action
  const admin = (await db.execute('SELECT name FROM users WHERE id = ?', [adminId])).rows[0] as any;
  const changedFields: string[] = [];
  if (deal !== undefined) changedFields.push('deal');
  if (status !== undefined) changedFields.push('status');
  if (score_a !== undefined) changedFields.push('score');
  if (changedFields.length > 0) {
    await logActivity(adminId, admin?.name || adminId, status === 'finished' ? 'update_result' : 'update_deal', {
      matchId: id,
      match: `${match.team_a_name} vs ${match.team_b_name}`,
      ...(deal !== undefined && { deal: newDeal, dealSide: newDealSide }),
      ...(status !== undefined && { status, score_a, score_b }),
    });
  }

  const updated = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0];
  res.json(updated);
});

router.get('/:id/pickable', async (req: Request, res: Response) => {
  const match = (await db.execute('SELECT * FROM matches WHERE id = ?', [req.params.id])).rows[0] as any;
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
    result = `${match.team_a_name} wins Deal (after adding ${match.deal})`;
  } else if (adjustedB > adjustedA) {
    result = `${match.team_b_name} wins Deal (after adding ${match.deal})`;
  } else {
    result = `Deal Draw`;
  }

  return {
    dealTeam,
    dealValue: match.deal,
    adjustedA,
    adjustedB,
    result,
    summary: `${match.team_a_name} ${match.score_a}-${match.score_b} ${match.team_b_name}. Deal ${match.deal} for ${dealTeam}. → ${result}`,
  };
}

export default router;
