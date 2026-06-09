import db from '../db.js';

const BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;

// Map common name variations between our DB and The Odds API
const NAME_ALIASES: Record<string, string> = {
  'USA': 'United States',
  'KOR': 'South Korea',
  'PRK': 'North Korea',
  'CIV': "Côte d'Ivoire",
  'IRN': 'Iran',
  'NED': 'Netherlands',
  'GER': 'Germany',
  'NZL': 'New Zealand',
  'CPV': 'Cape Verde',
  'KSA': 'Saudi Arabia',
  'URU': 'Uruguay',
  'IRQ': 'Iraq',
  'COD': 'DR Congo',
  'ALG': 'Algeria',
  'AUT': 'Austria',
  'JOR': 'Jordan',
  'UZB': 'Uzbekistan',
  'COL': 'Colombia',
  'CRO': 'Croatia',
  'GHA': 'Ghana',
  'PAN': 'Panama',
  'ENG': 'England',
  'SCO': 'Scotland',
  'WAL': 'Wales',
  'NIR': 'Northern Ireland',
  'POR': 'Portugal',
  'FRA': 'France',
  'ESP': 'Spain',
  'BEL': 'Belgium',
  'ARG': 'Argentina',
  'BRA': 'Brazil',
  'JPN': 'Japan',
  'AUS': 'Australia',
  'MAR': 'Morocco',
  'SEN': 'Senegal',
  'TUN': 'Tunisia',
  'EGY': 'Egypt',
  'CAN': 'Canada',
  'MEX': 'Mexico',
  'QAT': 'Qatar',
  'ECU': 'Ecuador',
  'PAR': 'Paraguay',
  'PER': 'Peru',
  'CHI': 'Chile',
  'BOL': 'Bolivia',
  'VEN': 'Venezuela',
  'SWE': 'Sweden',
  'NOR': 'Norway',
  'DEN': 'Denmark',
  'POL': 'Poland',
  'CZE': 'Czech Republic',
  'SVK': 'Slovakia',
  'HUN': 'Hungary',
  'ROU': 'Romania',
  'BUL': 'Bulgaria',
  'SRB': 'Serbia',
  'CRO': 'Croatia',
  'SLO': 'Slovenia',
  'BIH': 'Bosnia and Herzegovina',
  'GRE': 'Greece',
  'TUR': 'Turkey',
  'UKR': 'Ukraine',
  'RUS': 'Russia',
  'SUI': 'Switzerland',
  'HAI': 'Haiti',
  'JAM': 'Jamaica',
  'CRC': 'Costa Rica',
  'HON': 'Honduras',
  'SLV': 'El Salvador',
  'PAN': 'Panama',
  'CUW': 'Curaçao',
};

function findTeamSide(
  outcomeName: string,
  teamAName: string,
  teamACode: string,
  teamBName: string,
  teamBCode: string,
): 'A' | 'B' | null {
  const name = outcomeName.toLowerCase().trim();

  const aliasA = NAME_ALIASES[teamACode]?.toLowerCase();
  const aliasB = NAME_ALIASES[teamBCode]?.toLowerCase();

  if (name === teamAName.toLowerCase() || name === aliasA || name === teamACode.toLowerCase()) return 'A';
  if (name === teamBName.toLowerCase() || name === aliasB || name === teamBCode.toLowerCase()) return 'B';

  // Fuzzy: check if outcome name contains the team name or vice versa
  if (name.includes(teamAName.toLowerCase().slice(0, 4)) || teamAName.toLowerCase().includes(name.slice(0, 4))) return 'A';
  if (name.includes(teamBName.toLowerCase().slice(0, 4)) || teamBName.toLowerCase().includes(name.slice(0, 4))) return 'B';

  return null;
}

export async function syncOdds(): Promise<{ updated: number; message: string }> {
  if (!API_KEY) {
    throw new Error('ODDS_API_KEY not configured in .env');
  }

  const upcoming = (await db.execute(
    "SELECT * FROM matches WHERE status = 'upcoming' ORDER BY date, time"
  )).rows as any[];

  if (upcoming.length === 0) {
    return { updated: 0, message: 'No upcoming matches to sync odds for.' };
  }

  let updated = 0;
  const errors: string[] = [];

  // Fetch odds for all World Cup matches in one API call
  try {
    const url = `${BASE}/sports/soccer_world_cup/odds/?apiKey=${API_KEY}&regions=eu&markets=spreads&oddsFormat=decimal`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Odds API error ${res.status}: ${text}`);
    }

    const data: any[] = await res.json();

    for (const match of upcoming) {
      try {
        // Find matching odds entry
        const oddsEntry = data.find((entry: any) => {
          const home = entry.home_team?.toLowerCase() || '';
          const away = entry.away_team?.toLowerCase() || '';
          const aName = match.team_a_name.toLowerCase();
          const bName = match.team_b_name.toLowerCase();
          const aAlias = NAME_ALIASES[match.team_a_code]?.toLowerCase();
          const bAlias = NAME_ALIASES[match.team_b_code]?.toLowerCase();

          return (
            (home === aName || home === aAlias || away === aName || away === aAlias) &&
            (home === bName || home === bAlias || away === bName || away === bAlias)
          );
        });

        if (!oddsEntry) continue;

        // Get spreads from first bookmaker that has them
        const bookmaker = oddsEntry.bookmakers?.find((b: any) =>
          b.markets?.find((m: any) => m.key === 'spreads')
        );
        if (!bookmaker) continue;

        const spreadMarket = bookmaker.markets.find((m: any) => m.key === 'spreads');
        if (!spreadMarket || spreadMarket.outcomes.length < 2) continue;

        const o1 = spreadMarket.outcomes[0];
        const o2 = spreadMarket.outcomes[1];

        // Find which outcome has the positive spread (underdog)
        const underdog = o1.point > o2.point ? o1 : o2;
        const point = Math.abs(underdog.point);

        const side = findTeamSide(
          underdog.name,
          match.team_a_name, match.team_a_code,
          match.team_b_name, match.team_b_code,
        );

        if (!side) continue;

        const deal = point === 0 ? '+0' : `+${point}`;

        await db.execute(
          'UPDATE matches SET deal = ?, deal_side = ? WHERE id = ?',
          [deal, side, match.id],
        );
        updated++;
      } catch {
        // Skip individual match errors
      }
    }
  } catch (err: any) {
    throw new Error(`Failed to fetch odds: ${err.message}`);
  }

  return {
    updated,
    message: updated > 0
      ? `Updated handicap for ${updated} matches.`
      : `No odds found. Errors: ${errors.join('; ') || 'none'}`,
  };
}
