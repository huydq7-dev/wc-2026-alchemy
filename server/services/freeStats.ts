// Free stats from wcstat.orangecloud.vn — no API key needed
// Works server-side only (browser requests get 403)

const BASE = 'https://wcstat.orangecloud.vn/api/matches';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<any>>();

const TTL = {
  live: 120_000,        // 2 min
  finished: 86_400_000, // 24 h
};

// FIFA code → slug name used by wcstat API
// Generated from openfootball name_normalised (preferred) or name
const CODE_TO_SLUG: Record<string, string> = {
  ALG: 'algeria',
  ARG: 'argentina',
  AUS: 'australia',
  AUT: 'austria',
  BEL: 'belgium',
  BIH: 'bosnia-and-herzegovina',
  BRA: 'brazil',
  CAN: 'canada',
  CIV: 'cote-d-ivoire',
  COD: 'congo-dr',
  COL: 'colombia',
  CPV: 'cabo-verde',
  CRO: 'croatia',
  CUW: 'curacao',
  CZE: 'czechia',
  ECU: 'ecuador',
  EGY: 'egypt',
  ENG: 'england',
  ESP: 'spain',
  FRA: 'france',
  GER: 'germany',
  GHA: 'ghana',
  HAI: 'haiti',
  IRN: 'ir-iran',
  IRQ: 'iraq',
  JOR: 'jordan',
  JPN: 'japan',
  KOR: 'korea-republic',
  KSA: 'saudi-arabia',
  MAR: 'morocco',
  MEX: 'mexico',
  NED: 'netherlands',
  NOR: 'norway',
  NZL: 'new-zealand',
  PAN: 'panama',
  PAR: 'paraguay',
  POR: 'portugal',
  QAT: 'qatar',
  RSA: 'south-africa',
  SCO: 'scotland',
  SEN: 'senegal',
  SUI: 'switzerland',
  SWE: 'sweden',
  TUN: 'tunisia',
  TUR: 'turkiye',
  URU: 'uruguay',
  USA: 'united-states',
  UZB: 'uzbekistan',
};

export interface FreeStatsTeam {
  teamName: string;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  passes: number;
  passAccuracy: number;
}

export interface FreeStatsEvents {
  goals: number;
  yellowCards: number;
  redCards: number;
  substitutions: number;
}

export interface FreeStatsData {
  matchId: string;
  slug: string;
  status: string;
  homeScore: number;
  awayScore: number;
  home: FreeStatsTeam;
  away: FreeStatsTeam;
  events: FreeStatsEvents;
  updatedAt: string;
}

function buildSlug(matchId: string): string | null {
  // Group matches: Group-{letter}-{codeA}-{codeB}
  const parts = matchId.split('-');
  if (parts.length < 4 || parts[0] !== 'Group') return null;

  const groupLetter = parts[1].toLowerCase();
  const codeA = parts[2];
  const codeB = parts[3];

  const slugA = CODE_TO_SLUG[codeA];
  const slugB = CODE_TO_SLUG[codeB];
  if (!slugA || !slugB) return null;

  return `vong-bang-${groupLetter}-${slugA}-vs-${slugB}`;
}

export async function getMatchStats(matchId: string): Promise<FreeStatsData | null> {
  const slug = buildSlug(matchId);
  if (!slug) return null;

  const cacheKey = `stats:${slug}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    const ttl = cache.get(`${cacheKey}:ttl`)?.data ?? TTL.finished;
    if (Date.now() - cached.ts < ttl) return cached.data;
  }

  try {
    const res = await fetch(`${BASE}/${slug}/stats`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`wcstat ${res.status}`);
    }

    const json = await res.json();
    const d = json.data;
    if (!d) return null;

    const data: FreeStatsData = {
      matchId: d.matchId,
      slug: d.slug,
      status: d.status,
      homeScore: d.homeScore,
      awayScore: d.awayScore,
      home: {
        teamName: d.home.teamName,
        possession: d.home.possession,
        shots: d.home.shots,
        shotsOnTarget: d.home.shotsOnTarget,
        xg: d.home.xg,
        passes: d.home.passes,
        passAccuracy: d.home.passAccuracy,
      },
      away: {
        teamName: d.away.teamName,
        possession: d.away.possession,
        shots: d.away.shots,
        shotsOnTarget: d.away.shotsOnTarget,
        xg: d.away.xg,
        passes: d.away.passes,
        passAccuracy: d.away.passAccuracy,
      },
      events: {
        goals: d.events.goals,
        yellowCards: d.events.yellowCards,
        redCards: d.events.redCards,
        substitutions: d.events.substitutions,
      },
      updatedAt: d.updatedAt,
    };

    const ttl = d.status === 'completed' ? TTL.finished : TTL.live;
    cache.set(cacheKey, { data, ts: Date.now() });
    cache.set(`${cacheKey}:ttl`, { data: ttl, ts: Date.now() });

    return data;
  } catch (err: any) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn('[freeStats] fetch failed, serving cached:', err.message);
      return cached.data;
    }
    console.error('[freeStats] error:', err.message);
    return null;
  }
}
