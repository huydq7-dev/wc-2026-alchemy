import db from '../db.js';
import { calculateResult } from '../gameLogic.js';

const BASE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026';

interface OFTeam {
  name: string;
  fifa_code: string;
  flag_icon: string;
  group: string;
}

interface OFMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  num?: number;
  score1?: number;
  score2?: number;
}

function stageFromRound(round: string): string {
  if (round.startsWith('Matchday')) return 'Group Stage';
  if (round === 'Round of 32') return 'Round of 32';
  if (round === 'Round of 16') return 'Round of 16';
  if (round === 'Quarter-finals') return 'Quarter-finals';
  if (round === 'Semi-finals') return 'Semi-finals';
  if (round === 'Match for third place') return 'Third Place';
  if (round === 'Final') return 'Final';
  return round;
}

function convertToVietnamTime(date: string, ofTime: string): { date: string; time: string } {
  const match = ofTime.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) return { date, time: ofTime };

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const offset = parseInt(match[3]);

  // Convert to UTC minutes from midnight
  const utcMinutes = hours * 60 + minutes - offset * 60;
  // Convert UTC to Vietnam (UTC+7)
  const vnTotalMinutes = utcMinutes + 7 * 60;

  // Handle day overflow/underflow
  const dayOffset = Math.floor(vnTotalMinutes / (24 * 60));
  const vnMinutes = ((vnTotalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const vnHours = Math.floor(vnMinutes / 60);
  const vnMins = vnMinutes % 60;

  let vnDate = date;
  if (dayOffset !== 0) {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + dayOffset);
    vnDate = d.toISOString().slice(0, 10);
  }

  return {
    date: vnDate,
    time: `${String(vnHours).padStart(2, '0')}:${String(vnMins).padStart(2, '0')}`,
  };
}

function generateMatchId(ofMatch: OFMatch, teamMap: Map<string, OFTeam>): string {
  if (ofMatch.num != null) return `KO-${ofMatch.num}`;

  const t1 = teamMap.get(ofMatch.team1);
  const t2 = teamMap.get(ofMatch.team2);
  const grp = ofMatch.group?.replace(' ', '-') || 'XX';
  const c1 = t1?.fifa_code || ofMatch.team1.slice(0, 3).toUpperCase();
  const c2 = t2?.fifa_code || ofMatch.team2.slice(0, 3).toUpperCase();
  return `${grp}-${c1}-${c2}`;
}

async function processMatchResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: string,
  match: any,
) {
  // Insert auto-loss for users who didn't predict
  const allUsers = (await db.execute('SELECT id FROM users')).rows as any[];
  const existingPreds = (await db.execute('SELECT user_id FROM predictions WHERE match_id = ?', [matchId])).rows as any[];
  const predictedIds = new Set(existingPreds.map((p: any) => p.user_id));
  const missingUsers = allUsers.filter((u: any) => !predictedIds.has(u.id));

  if (missingUsers.length > 0) {
    await db.batch(
      missingUsers.map((u: any) => ({
        sql: 'INSERT OR IGNORE INTO predictions (user_id, match_id, pick, result, points, auto_loss) VALUES (?, ?, ?, ?, ?, 1)',
        args: [u.id, matchId, 'A', 'lose', -1],
      })),
      'write',
    );
  }

  // Recalculate non-auto predictions
  const predictions = (
    await db.execute('SELECT * FROM predictions WHERE match_id = ? AND auto_loss = 0', [matchId])
  ).rows as any[];

  if (predictions.length > 0) {
    const stmts = predictions.map((pred: any) => {
      const result = calculateResult(scoreA, scoreB, deal, dealSide, pred.pick as 'A' | 'B');
      const points = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
      return {
        sql: 'UPDATE predictions SET result = ?, points = ? WHERE id = ?',
        args: [result, points, pred.id],
      };
    });
    await db.batch(stmts, 'write');
  }
}

export async function syncMatches(): Promise<{ synced: number; message: string }> {
  // 1. Fetch teams
  const teamsRes = await fetch(`${BASE}/worldcup.teams.json`);
  if (!teamsRes.ok) throw new Error(`Failed to fetch teams: ${teamsRes.status}`);
  const teams: OFTeam[] = await teamsRes.json();

  const teamMap = new Map<string, OFTeam>();
  for (const t of teams) {
    teamMap.set(t.name, t);
  }

  // Persist teams
  await db.batch(
    teams.map(t => ({
      sql: 'INSERT OR REPLACE INTO teams (name, fifa_code, flag_icon, group_name) VALUES (?, ?, ?, ?)',
      args: [t.name, t.fifa_code, t.flag_icon, t.group],
    })),
    'write',
  );

  // 2. Fetch matches
  const matchesRes = await fetch(`${BASE}/worldcup.json`);
  if (!matchesRes.ok) throw new Error(`Failed to fetch matches: ${matchesRes.status}`);
  const data = await matchesRes.json();
  const ofMatches: OFMatch[] = data.matches;

  // 3. Get existing match IDs to distinguish insert vs update
  const existingResult = await db.execute('SELECT id FROM matches');
  const existingIds = new Set(existingResult.rows.map((r: any) => r.id));

  let inserted = 0;
  let updated = 0;

  for (const m of ofMatches) {
    const id = generateMatchId(m, teamMap);

    const t1 = teamMap.get(m.team1);
    const t2 = teamMap.get(m.team2);

    const team_a_code = t1?.fifa_code || 'TBD';
    const team_a_flag = t1?.flag_icon || '🏳️';
    const team_b_code = t2?.fifa_code || 'TBD';
    const team_b_flag = t2?.flag_icon || '🏳️';

    const stage = stageFromRound(m.round);
    const vn = convertToVietnamTime(m.date, m.time);
    const hasScores = m.score1 != null && m.score2 != null;

    if (existingIds.has(id)) {
      if (hasScores) {
        const match = (await db.execute('SELECT * FROM matches WHERE id = ?', [id])).rows[0] as any;
        await db.execute(
          'UPDATE matches SET status = ?, score_a = ?, score_b = ? WHERE id = ?',
          ['finished', m.score1, m.score2, id],
        );
        updated++;

        // Recalculate predictions + auto-loss for missed picks
        await processMatchResult(id, m.score1!, m.score2!, match.deal, match.deal_side, match);
      }
    } else {
      await db.execute({
        sql: `INSERT OR IGNORE INTO matches (id, date, time, team_a_name, team_a_code, team_a_flag, team_b_name, team_b_code, team_b_flag, deal, deal_side, venue, stage, status, score_a, score_b)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, vn.date, vn.time,
          m.team1, team_a_code, team_a_flag,
          m.team2, team_b_code, team_b_flag,
          '+0', 'A',
          m.ground || null, stage,
          hasScores ? 'finished' : 'upcoming',
          m.score1 ?? null, m.score2 ?? null,
        ],
      });
      inserted++;
    }
  }

  return {
    synced: inserted + updated,
    message: `Added ${inserted} new matches, updated ${updated} with scores.`,
  };
}
