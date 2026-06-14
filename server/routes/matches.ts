import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateResult, getEffectiveStatus, isPickAllowed } from '../gameLogic.js';
import { requireAdmin } from '../middleware/admin.js';
import { logActivity } from '../services/activity.js';
import { isApiAvailable } from '../services/wcstatSync.js';
import { getSingleValue, isPick, requireSingleValue } from '../utils/request.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = getSingleValue(req.query.status);
    const stage = getSingleValue(req.query.stage);
    let query = 'SELECT * FROM matches';
    const conditions: string[] = [];
    const params: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (stage) {
      conditions.push('stage = ?');
      params.push(stage);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY date, time';

    const result = await db.execute(query, params);
    const rows = result.rows.map((row: any) => ({
      ...row,
      status: getEffectiveStatus(row.status, row.date, row.time),
    }));
    res.json(rows);
  } catch (err: any) {
    console.error('[matches] list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/next', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM matches ORDER BY date, time');
    const upcoming = result.rows.filter((row: any) => {
      const s = getEffectiveStatus(row.status, row.date, row.time);
      return s === 'upcoming';
    });
    const next = upcoming[0] || null;
    res.json(next ? { ...next, status: 'upcoming' } : null);
  } catch (err: any) {
    console.error('[matches] next error:', err.message);
    res.status(500).json({ error: 'Failed to fetch next match' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = requireSingleValue(req.params.id);
    const row = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0] as any;
    if (!row) return res.status(404).json({ error: 'Match not found' });

    const match = { ...row, status: getEffectiveStatus(row.status, row.date, row.time) };

    const predictions = (
      await db.execute(
        `SELECT p.*, u.name, u.avatar FROM predictions p
       JOIN users u ON p.user_id = u.id
       WHERE p.match_id = ?`,
        [id],
      )
    ).rows;

    const dealInfo = generateDealExplanation(match);

    res.json({ ...match, predictions, dealInfo });
  } catch (err: any) {
    console.error('[matches] detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

async function recalculateAllPredictions(
  matchId: string,
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: 'A' | 'B',
) {
  const predictions = (
    await db.execute('SELECT * FROM predictions WHERE match_id = ? AND auto_loss = 0', [matchId])
  ).rows as any[];

  const stmts = predictions.map((pred: any) => {
    const result = calculateResult(scoreA, scoreB, deal, dealSide, pred.pick as 'A' | 'B');
    const points = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
    return {
      sql: 'UPDATE predictions SET result = ?, points = ? WHERE id = ?',
      args: [result, points, pred.id],
    };
  });

  if (stmts.length > 0) await db.batch(stmts, 'write');
}

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = requireSingleValue(req.params.id);
    const { status, score_a, score_b, deal, deal_side } = req.body;
    const adminId = getSingleValue(req.headers['x-user-id']);
    if (!adminId) return res.status(401).json({ error: 'Not logged in' });

    // Block manual score/status edits when wcstat API is reachable
    const wantsScoreEdit = score_a !== undefined || score_b !== undefined;
    const wantsStatusChange = status !== undefined;
    if ((wantsScoreEdit || wantsStatusChange) && isApiAvailable()) {
      return res.status(423).json({
        error: 'Scores are synced automatically from the official source. Manual edits are only available when the sync API is unreachable.',
      });
    }

    const match = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0] as any;
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const newDeal = deal ?? match.deal;
    const nextDealSide = deal_side ?? match.deal_side;
    const newDealSide: 'A' | 'B' = isPick(nextDealSide) ? nextDealSide : 'A';

    const dealChanged = deal !== undefined || deal_side !== undefined;
    await db.execute(
      `UPDATE matches SET status = ?, score_a = ?, score_b = ?, deal = ?, deal_side = ?${dealChanged ? ', deal_manual = 1' : ''} WHERE id = ?`,
      [
        status || match.status,
        score_a ?? match.score_a,
        score_b ?? match.score_b,
        newDeal,
        newDealSide,
        id,
      ],
    );

    if (status === 'finished' && score_a != null && score_b != null) {
      const allUsers = (await db.execute('SELECT id, name FROM users')).rows as any[];
      const existingPreds = (
        await db.execute('SELECT user_id FROM predictions WHERE match_id = ?', [id])
      ).rows as any[];
      const predictedIds = new Set(existingPreds.map((p: any) => p.user_id));
      const missingUsers = allUsers.filter((u: any) => !predictedIds.has(u.id));

      if (missingUsers.length > 0) {
        await db.batch(
          missingUsers.map((u: any) => ({
            sql: "INSERT OR IGNORE INTO predictions (user_id, match_id, pick, result, points, auto_loss, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now', '+7 hours'))",
            args: [u.id, id, 'A', 'lose', -1],
          })),
          'write',
        );
        for (const u of missingUsers) {
          logActivity(adminId, u.name, 'auto_loss', {
            matchId: id,
            match: `${match.team_a_name} vs ${match.team_b_name}`,
            reason: 'No prediction submitted',
          }).catch(() => {});
        }
      }

      await recalculateAllPredictions(id, score_a, score_b, newDeal, newDealSide);
    } else if (
      match.status === 'finished' &&
      (deal !== undefined || deal_side !== undefined) &&
      match.score_a != null &&
      match.score_b != null
    ) {
      await recalculateAllPredictions(id, match.score_a, match.score_b, newDeal, newDealSide);
    }

    const admin = (await db.execute('SELECT name FROM users WHERE id = ?', [adminId]))
      .rows[0] as any;
    const changedFields: string[] = [];
    if (deal !== undefined) changedFields.push('deal');
    if (status !== undefined) changedFields.push('status');
    if (score_a !== undefined) changedFields.push('score');
    if (changedFields.length > 0) {
      await logActivity(
        adminId,
        admin?.name || adminId,
        status === 'finished' ? 'update_result' : 'update_deal',
        {
          matchId: id,
          match: `${match.team_a_name} vs ${match.team_b_name}`,
          ...(deal !== undefined && { deal: newDeal, dealSide: newDealSide }),
          ...(status !== undefined && { status, score_a, score_b }),
        },
      );
    }

    const updated = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0];
    res.json(updated);
  } catch (err: any) {
    console.error('[matches] patch error:', err.message);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

router.get('/:id/pickable', async (req: Request, res: Response) => {
  try {
    const id = requireSingleValue(req.params.id);
    const row = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0] as any;
    if (!row) return res.status(404).json({ error: 'Match not found' });

    const effectiveStatus = getEffectiveStatus(row.status, row.date, row.time);
    const allowed = effectiveStatus === 'upcoming' && isPickAllowed(row.date, row.time);
    res.json({ pickable: allowed });
  } catch (err: any) {
    console.error('[matches] pickable error:', err.message);
    res.status(500).json({ error: 'Failed to check pickability' });
  }
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

router.post('/sync-odds', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { syncOdds } = await import('../services/odds.js');
    const result = await syncOdds();
    const admin = (
      await db.execute('SELECT name FROM users WHERE id = ?', [req.headers['x-user-id'] as string])
    ).rows[0] as any;
    await logActivity(req.headers['x-user-id'] as string, admin?.name || 'Admin', 'sync_odds', {
      updated: result.updated,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
