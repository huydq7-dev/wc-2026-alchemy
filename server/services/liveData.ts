// Highlightly Football API cache layer
// World Cup 2026 league ID: 1635

const BASE = "https://football-highlights-api.p.rapidapi.com";
const LEAGUE_ID = "1635";
const API_KEY = process.env.HIGHLIGHTLY_API_KEY || "";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<any>>();

const TTL = {
  live: 30_000,      // 30s for live matches
  upcoming: 300_000, // 5min otherwise
  finished: 600_000, // 10min for finished
};

function ttlFor(matches: RawMatch[]): number {
  const hasLive = matches.some((m) => m.status === "live" || m.status === "1H" || m.status === "2H" || m.status === "HT");
  return hasLive ? TTL.live : TTL.upcoming;
}

function isStale(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return true;
  return Date.now() - entry.ts > (cache.get(key + ":ttl")?.data ?? TTL.upcoming);
}

async function fetchHL<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "football-highlights-api.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    throw new Error(`Highlightly API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ── Types ──

export interface RawMatch {
  id: string;
  date: string;
  time: string;
  status: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  home_logo: string;
  away_logo: string;
  league: string;
  venue?: string;
  referee?: string;
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
  home: {
    formation: string;
    starters: LineupPlayer[];
    substitutes: LineupPlayer[];
    coach: string;
  };
  away: {
    formation: string;
    starters: LineupPlayer[];
    substitutes: LineupPlayer[];
    coach: string;
  };
}

export interface MatchDetail {
  id: string;
  date: string;
  time: string;
  status: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  venue?: string;
  referee?: string;
  forecast?: { temperature: string; status: string };
  events: MatchEvent[];
  statistics: MatchStat[];
  predictions?: { home: string; draw: string; away: string };
}

// ── Public API ──

export async function getMatches(date?: string): Promise<RawMatch[]> {
  const key = `matches:${date || "today"}`;

  if (!isStale(key)) return cache.get(key)!.data;

  const params: Record<string, string> = { leagueId: LEAGUE_ID };
  if (date) params.date = date;

  const result = await fetchHL<any>("/matches", params);
  const matches: RawMatch[] = result?.data ?? result?.matches ?? [];

  cache.set(key, { data: matches, ts: Date.now() });
  cache.set(key + ":ttl", { data: ttlFor(matches), ts: Date.now() });

  return matches;
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const key = `match:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<any>(`/matches/${matchId}`);
    const m = result?.data ?? result;

    const detail: MatchDetail = {
      id: m.id ?? matchId,
      date: m.date ?? "",
      time: m.time ?? "",
      status: m.status ?? "",
      home: m.home ?? m.home_name ?? "",
      away: m.away ?? m.away_name ?? "",
      home_score: String(m.home_score ?? m.homeScore ?? "0"),
      away_score: String(m.away_score ?? m.awayScore ?? "0"),
      venue: m.venue ?? m.stadium,
      referee: m.referee,
      forecast: m.forecast ?? m.weather,
      events: normalizeEvents(m.events ?? m.matchEvents ?? []),
      statistics: normalizeStats(m.statistics ?? m.stats ?? m.matchStats ?? []),
      predictions: m.predictions ? {
        home: String(m.predictions.home ?? ""),
        draw: String(m.predictions.draw ?? ""),
        away: String(m.predictions.away ?? ""),
      } : undefined,
    };

    cache.set(key, { data: detail, ts: Date.now() });
    cache.set(key + ":ttl", { data: detail.status === "live" ? TTL.live : TTL.finished, ts: Date.now() });

    return detail;
  } catch {
    return null;
  }
}

export async function getLineups(matchId: string): Promise<MatchLineups | null> {
  const key = `lineups:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<any>(`/lineups/${matchId}`);
    const data = result?.data ?? result;

    const lineups: MatchLineups = {
      home: normalizeLineup(data?.home ?? data?.homeTeam ?? {}),
      away: normalizeLineup(data?.away ?? data?.awayTeam ?? {}),
    };

    cache.set(key, { data: lineups, ts: Date.now() });
    cache.set(key + ":ttl", { data: TTL.live, ts: Date.now() });

    return lineups;
  } catch {
    return null;
  }
}

// ── Normalization helpers (API response shapes vary) ──

function normalizeEvents(raw: any[]): MatchEvent[] {
  return raw.map((e: any) => ({
    time: String(e.time ?? e.minute ?? ""),
    type: e.type ?? e.event ?? "",
    player: e.player ?? e.player_name ?? e.scorer ?? "",
    team: e.team ?? e.team_name ?? "",
    assist: e.assist ?? e.assist_player ?? undefined,
    substituted: e.substituted ?? e.player_out ?? undefined,
  }));
}

function normalizeStats(raw: any[]): MatchStat[] {
  return raw.map((s: any) => ({
    type: s.type ?? s.name ?? s.stat ?? "",
    home: String(s.home ?? s.homeValue ?? s.home_value ?? "0"),
    away: String(s.away ?? s.awayValue ?? s.away_value ?? "0"),
  }));
}

function normalizeLineup(raw: any): MatchLineups["home"] {
  const starters = (raw.starters ?? raw.startingXI ?? raw.starting ?? []).map((p: any) => ({
    name: p.name ?? p.player ?? p.player_name ?? "",
    number: Number(p.number ?? p.jersey ?? p.shirt ?? 0),
    position: p.position ?? p.pos ?? p.role ?? "",
  }));

  const substitutes = (raw.substitutes ?? raw.subs ?? raw.bench ?? []).map((p: any) => ({
    name: p.name ?? p.player ?? p.player_name ?? "",
    number: Number(p.number ?? p.jersey ?? p.shirt ?? 0),
    position: p.position ?? p.pos ?? p.role ?? "",
  }));

  return {
    formation: raw.formation ?? raw.formation_name ?? "4-4-2",
    starters,
    substitutes,
    coach: raw.coach ?? raw.coach_name ?? raw.manager ?? "",
  };
}

// Flush cache periodically (every 10min) to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (key.endsWith(":ttl")) continue;
    const ttl = cache.get(key + ":ttl")?.data ?? TTL.finished;
    if (now - entry.ts > ttl * 4) cache.delete(key);
  }
}, 600_000).unref();
