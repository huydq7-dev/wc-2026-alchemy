// Highlightly Football API cache layer
// World Cup 2026 league ID: 1635
// Primary: RapidAPI (higher quota), Fallback: direct soccer.highlightly.net

const BASE_RAPID = 'https://sport-highlights-api.p.rapidapi.com/football';
const BASE_DIRECT = 'https://soccer.highlightly.net';
const LEAGUE_ID = '1635';
const API_KEY = process.env.HIGHLIGHTLY_API_KEY || '';
const RAPID_KEY = process.env.RAPIDAPI_KEY || '';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<any>>();

const TTL = {
  live: 120_000,              // 2 min — live scores change frequently
  upcoming: 1_800_000,        // 30 min — lineups/schedule change slowly
  finished: 86_400_000,       // 24 h — finished match data never changes
};

// ── Actual API response shapes ──

interface HLMatch {
  id: number;
  date: string; // ISO
  round?: string;
  state: {
    clock: number | null;
    score: { current: string | null; penalties: string | null };
    description: string;
  };
  homeTeam: { id: number; name: string; logo: string | null };
  awayTeam: { id: number; name: string; logo: string | null };
  league: { id: number; name: string; season: number };
}

interface HLMatchDetail extends HLMatch {
  venue?: {
    city: string | null;
    name: string | null;
    country: string | null;
    capacity: string | null;
  };
  referee?: { name: string | null; nationality: string | null };
  forecast?: { status: string | null; temperature: string | null };
  events: any[];
  statistics: { statistics: any[]; team: { id: number; name: string; logo: string | null } }[];
  predictions?: { prematch: any[]; live: any[] };
}

interface HLLineups {
  homeTeam: { formation: string; initialLineup: any[]; substitutes: any[]; name: string | null };
  awayTeam: { formation: string; initialLineup: any[]; substitutes: any[]; name: string | null };
}

// ── Our normalized types ──

export interface RawMatch {
  id: string;
  date: string;
  status: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  home_logo: string;
  away_logo: string;
  league: string;
  round?: string;
}

export interface MatchEvent {
  time: string;
  type: string;
  player: string;
  team: string;
  assist?: string;
  substituted?: string;
}

export interface MatchStat {
  type: string;
  home: string;
  away: string;
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

export interface MatchLineups {
  home: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[] };
  away: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[] };
}

export interface MatchDetail {
  id: string;
  date: string;
  status: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  home_logo: string;
  away_logo: string;
  league: string;
  round?: string;
  venue?: string;
  referee?: string;
  forecast?: { temperature: string; status: string };
  events: MatchEvent[];
  statistics: MatchStat[];
  predictions?: { home: string; draw: string; away: string };
}

// ── Helpers ──

function isLiveStatus(s: string) {
  return s === '1H' || s === '2H' || s === 'HT' || s === 'live' || s === 'Live';
}

function ttlForStatus(status: string): number {
  if (isLiveStatus(status)) return TTL.live;
  if (status === 'Finished' || status === 'finished') return TTL.finished;
  return TTL.upcoming;
}

function isStale(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return true;
  return Date.now() - entry.ts > (cache.get(key + ':ttl')?.data ?? TTL.upcoming);
}

let rapidRateLimitedUntil: number | null = null;
let directRateLimitedUntil: number | null = null;

async function fetchHL<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  // Try RapidAPI first (higher quota BASIC plan), fall back to direct
  if (RAPID_KEY && !(rapidRateLimitedUntil && Date.now() < rapidRateLimitedUntil)) {
    try {
      // path is like "/matches" or "/statistics/123" — prepend BASE_RAPID (has /football)
      const url = new URL(BASE_RAPID + path);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString(), {
        headers: {
          'x-rapidapi-key': RAPID_KEY,
          'x-rapidapi-host': 'sport-highlights-api.p.rapidapi.com',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.message?.includes('breached')) throw new Error('rapid-limited');
        return json;
      }
      if (res.status === 429) {
        rapidRateLimitedUntil = Date.now() + 60_000;
        throw new Error('rapid-rate-limited');
      }
    } catch (e: any) {
      if (e.message === 'rapid-limited') rapidRateLimitedUntil = Date.now() + 300_000;
      // Don't fall through to direct — it has a tiny quota. Callers serve cached data.
      if (e.message === 'rapid-limited' || e.message === 'rapid-rate-limited') throw e;
      // For network errors, still try direct as fallback
    }
  }

  // Fallback: direct Highlightly (only when RapidAPI not rate-limited)
  if (directRateLimitedUntil && Date.now() < directRateLimitedUntil) {
    throw new Error('Highlightly rate limited — using cached data');
  }

  const url = new URL(path, BASE_DIRECT);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { 'x-rapidapi-key': API_KEY },
  });

  if (!res.ok) {
    if (res.status === 429) directRateLimitedUntil = Date.now() + 60_000;
    throw new Error(`Highlightly API ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json?.message?.includes('breached your daily request limits')) {
    directRateLimitedUntil = Date.now() + 300_000;
    throw new Error('Highlightly rate limited — using cached data');
  }

  return json;
}

function parseScore(score: string | null): { home: string; away: string } {
  if (!score) return { home: '0', away: '0' };
  const parts = score.split('-').map((s) => s.trim());
  return { home: parts[0] ?? '0', away: parts[1] ?? '0' };
}

function formatDate(iso: string): string {
  // "2026-06-11T19:00:00.000Z" → "2026-06-11"
  return iso.slice(0, 10);
}

function normalizeMatch(m: HLMatch): RawMatch {
  const score = parseScore(m.state.score.current);
  return {
    id: String(m.id),
    date: formatDate(m.date),
    status: m.state.description,
    home: m.homeTeam.name,
    away: m.awayTeam.name,
    home_score: score.home,
    away_score: score.away,
    home_logo: m.homeTeam.logo ?? '',
    away_logo: m.awayTeam.logo ?? '',
    league: m.league.name,
    round: m.round,
  };
}

function normalizeEvents(raw: any[]): MatchEvent[] {
  return raw.map((e: any) => {
    const player = e.player ?? e.player_name ?? '';
    const team = e.team ?? e.team_name ?? '';
    return {
      time: String(e.time ?? e.minute ?? ''),
      type: e.type ?? e.event ?? '',
      player: typeof player === 'string' ? player : player?.name ?? '',
      team: typeof team === 'string' ? team : team?.name ?? '',
      assist: e.assist ?? undefined,
      substituted: e.substituted ?? undefined,
    };
  });
}

function normalizeStats(raw: { statistics: any[]; team: { name: string } }[]): MatchStat[] {
  // Highlightly nests stats per team; flatten to home/away pairs
  if (raw.length < 2) return [];
  const homeStats = raw[0].statistics ?? [];
  const awayStats = raw[1].statistics ?? [];

  return homeStats.map((hs: any, i: number) => {
    const as = awayStats[i] ?? {};
    const type = hs.type ?? hs.name ?? '';
    return {
      type: typeof type === 'string' ? type : type?.name ?? '',
      home: String(hs.home ?? hs.value ?? '0'),
      away: String(as.away ?? as.value ?? '0'),
    };
  });
}

function safeField(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) return String(value.name);
  return '';
}

function normalizeLineup(raw: any): MatchLineups['home'] {
  const normalizePlayer = (p: any) => ({
    name: safeField(p.name ?? p.player ?? p.player_name ?? ''),
    number: Number(p.number ?? p.jersey ?? p.shirt ?? 0),
    position: safeField(p.position ?? p.pos ?? p.role ?? ''),
  });

  const starters = (raw.initialLineup ?? raw.starters ?? raw.startingXI ?? []).map(normalizePlayer);

  const substitutes = (raw.substitutes ?? raw.subs ?? raw.bench ?? []).map(normalizePlayer);

  return { formation: raw.formation ?? '4-4-2', starters, substitutes };
}

// ── Public API ──

const TIMEZONE = 'Asia/Bangkok'; // ICT / GMT+7

export async function getMatches(date?: string): Promise<RawMatch[]> {
  const key = `matches:${date || 'today'}:${TIMEZONE}`;

  if (!isStale(key)) return cache.get(key)!.data;

  const params: Record<string, string> = { leagueId: LEAGUE_ID, timezone: TIMEZONE };
  if (date) params.date = date;

  try {
    const result = await fetchHL<{ data: HLMatch[] }>('/matches', params);
    const matches = (result.data ?? []).map(normalizeMatch);

    if (matches.length > 0) {
      cache.set(key, { data: matches, ts: Date.now() });
      const worstStatus = matches.some((m) => isLiveStatus(m.status)) ? 'live' : matches[0].status;
      cache.set(key + ':ttl', { data: ttlForStatus(worstStatus), ts: Date.now() });
    }

    return matches;
  } catch (err: any) {
    // Serve stale cache if fetch fails (rate limit, network, etc.)
    const cached = cache.get(key);
    if (cached) {
      console.warn('[liveData] matches fetch failed, serving cached:', err.message);
      return cached.data;
    }
    throw err;
  }
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const key = `match:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<any>(`/matches/${matchId}`);
    // RapidAPI wraps in {data: [...]}, direct returns array or single object
    const raw = result?.data ?? result;
    const m = Array.isArray(raw) ? raw[0] : raw;

    if (!m) return null;

    const score = parseScore(m.state?.score?.current ?? null);

    // Extract win probabilities from the latest prematch prediction
    let predictions: MatchDetail['predictions'] | undefined;
    const pre = m.predictions?.prematch;
    if (pre && pre.length > 0) {
      const latest = pre[pre.length - 1];
      predictions = {
        home: latest.probabilities?.home ?? '',
        draw: latest.probabilities?.draw ?? '',
        away: latest.probabilities?.away ?? '',
      };
    }

    const detail: MatchDetail = {
      id: String(m.id ?? matchId),
      date: formatDate(m.date ?? ''),
      status: m.state?.description ?? '',
      home: m.homeTeam?.name ?? '',
      away: m.awayTeam?.name ?? '',
      home_score: score.home,
      away_score: score.away,
      home_logo: m.homeTeam?.logo ?? '',
      away_logo: m.awayTeam?.logo ?? '',
      league: m.league?.name ?? '',
      round: m.round,
      venue: m.venue?.name ?? undefined,
      referee: m.referee?.name ?? undefined,
      forecast: m.forecast?.temperature
        ? { temperature: m.forecast.temperature, status: m.forecast.status ?? '' }
        : undefined,
      events: normalizeEvents(m.events ?? []),
      statistics: normalizeStats(m.statistics ?? []),
      predictions,
    };

    cache.set(key, { data: detail, ts: Date.now() });
    cache.set(key + ':ttl', { data: ttlForStatus(detail.status), ts: Date.now() });

    return detail;
  } catch (err: any) {
    // Serve stale cache if fetch fails (rate limit, network, etc.)
    const cached = cache.get(key);
    if (cached) {
      console.warn('[liveData] match detail fetch failed, serving cached:', err.message);
      return cached.data;
    }
    console.error('[liveData] match detail error:', err.message);
    return null;
  }
}

// Dedicated stats fetch for finished matches — cache 24h (never changes)
export async function getFinishedMatchStats(
  matchId: string,
): Promise<{ statistics: MatchStat[] } | null> {
  const key = `stats:${matchId}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL.finished) return cached.data;

  try {
    const path = `/statistics/${matchId}`;
    // RapidAPI wraps data differently — try RapidAPI first
    const result = await fetchHL<{ data?: { statistics: any[] } } | { statistics: any[] }>(path);

    const rawStats: any[] =
      (result as any).data?.statistics ||
      (result as any).statistics ||
      (result as any).data ||
      [];

    if (!Array.isArray(rawStats) || rawStats.length === 0) {
      // Cache the empty result briefly so we don't hammer the API
      cache.set(key, { data: { statistics: [] }, ts: Date.now() });
      return { statistics: [] };
    }

    const statistics: MatchStat[] = rawStats.map((s: any) => {
      const type = s.type ?? s.name ?? '';
      return {
        type: typeof type === 'string' ? type : type?.name ?? '',
        home: String(s.home ?? s.value ?? '0'),
        away: String(s.away ?? s.value ?? '0'),
      };
    });

    const data = { statistics };
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch (err: any) {
    const cached = cache.get(key);
    if (cached) return cached.data;
    console.error('[liveData] stats error:', err.message);
    return { statistics: [] };
  }
}

export async function getLineups(matchId: string): Promise<MatchLineups | null> {
  const key = `lineups:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<any>(`/lineups/${matchId}`);
    // RapidAPI wraps in {data: {...}}, direct returns the object directly
    const data = result?.data ?? result;

    const lineups: MatchLineups = {
      home: normalizeLineup(data?.homeTeam ?? {}),
      away: normalizeLineup(data?.awayTeam ?? {}),
    };

    cache.set(key, { data: lineups, ts: Date.now() });
    cache.set(key + ':ttl', { data: TTL.upcoming, ts: Date.now() });

    return lineups;
  } catch (err: any) {
    console.error('[liveData] lineups error:', err.message);
    return null;
  }
}

// Flush stale cache entries every 10min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (key.endsWith(':ttl')) continue;
    const ttl = cache.get(key + ':ttl')?.data ?? TTL.finished;
    if (now - entry.ts > ttl * 4) cache.delete(key);
  }
}, 600_000).unref();
