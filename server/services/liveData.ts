// Highlightly Football API cache layer
// World Cup 2026 league ID: 1635
// Actual API base: soccer.highlightly.net (RapidAPI key works here too)

const BASE = "https://soccer.highlightly.net";
const LEAGUE_ID = "1635";
const API_KEY = process.env.HIGHLIGHTLY_API_KEY || "";

interface CacheEntry<T> { data: T; ts: number; }

const cache = new Map<string, CacheEntry<any>>();

const TTL = {
  live: 30_000,
  upcoming: 300_000,
  finished: 600_000,
};

// ── Actual API response shapes ──

interface HLMatch {
  id: number;
  date: string; // ISO
  round?: string;
  state: { clock: number | null; score: { current: string | null; penalties: string | null }; description: string };
  homeTeam: { id: number; name: string; logo: string | null };
  awayTeam: { id: number; name: string; logo: string | null };
  league: { id: number; name: string; season: number };
}

interface HLMatchDetail extends HLMatch {
  venue?: { city: string | null; name: string | null; country: string | null; capacity: string | null };
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
  home: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[]; };
  away: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[]; };
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
  return s === "1H" || s === "2H" || s === "HT" || s === "live" || s === "Live";
}

function ttlForStatus(status: string): number {
  if (isLiveStatus(status)) return TTL.live;
  if (status === "Finished" || status === "finished") return TTL.finished;
  return TTL.upcoming;
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
    headers: { "x-rapidapi-key": API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Highlightly API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

function parseScore(score: string | null): { home: string; away: string } {
  if (!score) return { home: "0", away: "0" };
  const parts = score.split("-").map(s => s.trim());
  return { home: parts[0] ?? "0", away: parts[1] ?? "0" };
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
    home_logo: m.homeTeam.logo ?? "",
    away_logo: m.awayTeam.logo ?? "",
    league: m.league.name,
    round: m.round,
  };
}

function normalizeEvents(raw: any[]): MatchEvent[] {
  return raw.map((e: any) => ({
    time: String(e.time ?? e.minute ?? ""),
    type: e.type ?? e.event ?? "",
    player: e.player ?? e.player_name ?? "",
    team: e.team ?? e.team_name ?? "",
    assist: e.assist ?? undefined,
    substituted: e.substituted ?? undefined,
  }));
}

function normalizeStats(raw: { statistics: any[]; team: { name: string } }[]): MatchStat[] {
  // Highlightly nests stats per team; flatten to home/away pairs
  if (raw.length < 2) return [];
  const homeStats = raw[0].statistics ?? [];
  const awayStats = raw[1].statistics ?? [];

  return homeStats.map((hs: any, i: number) => {
    const as = awayStats[i] ?? {};
    return {
      type: hs.type ?? hs.name ?? "",
      home: String(hs.home ?? hs.value ?? "0"),
      away: String(as.away ?? as.value ?? "0"),
    };
  });
}

function normalizeLineup(raw: any): MatchLineups["home"] {
  const starters = (raw.initialLineup ?? raw.starters ?? raw.startingXI ?? []).map((p: any) => ({
    name: p.name ?? p.player ?? p.player_name ?? "",
    number: Number(p.number ?? p.jersey ?? p.shirt ?? 0),
    position: p.position ?? p.pos ?? p.role ?? "",
  }));

  const substitutes = (raw.substitutes ?? raw.subs ?? raw.bench ?? []).map((p: any) => ({
    name: p.name ?? p.player ?? p.player_name ?? "",
    number: Number(p.number ?? p.jersey ?? p.shirt ?? 0),
    position: p.position ?? p.pos ?? p.role ?? "",
  }));

  return { formation: raw.formation ?? "4-4-2", starters, substitutes };
}

// ── Public API ──

export async function getMatches(date?: string): Promise<RawMatch[]> {
  const key = `matches:${date || "today"}`;

  if (!isStale(key)) return cache.get(key)!.data;

  const params: Record<string, string> = { leagueId: LEAGUE_ID };
  if (date) params.date = date;

  const result = await fetchHL<{ data: HLMatch[] }>("/matches", params);
  const matches = (result.data ?? []).map(normalizeMatch);

  cache.set(key, { data: matches, ts: Date.now() });
  const worstStatus = matches.length > 0
    ? matches.some(m => isLiveStatus(m.status)) ? "live" : matches[0].status
    : "upcoming";
  cache.set(key + ":ttl", { data: ttlForStatus(worstStatus), ts: Date.now() });

  return matches;
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const key = `match:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<HLMatchDetail[]>(`/matches/${matchId}`);
    // API returns an array with one element
    const m = Array.isArray(result) ? result[0] : (result as any);

    if (!m) return null;

    const score = parseScore(m.state?.score?.current ?? null);

    // Extract win probabilities from the latest prematch prediction
    let predictions: MatchDetail["predictions"] | undefined;
    const pre = m.predictions?.prematch;
    if (pre && pre.length > 0) {
      const latest = pre[pre.length - 1];
      predictions = {
        home: latest.probabilities?.home ?? "",
        draw: latest.probabilities?.draw ?? "",
        away: latest.probabilities?.away ?? "",
      };
    }

    const detail: MatchDetail = {
      id: String(m.id ?? matchId),
      date: formatDate(m.date ?? ""),
      status: m.state?.description ?? "",
      home: m.homeTeam?.name ?? "",
      away: m.awayTeam?.name ?? "",
      home_score: score.home,
      away_score: score.away,
      home_logo: m.homeTeam?.logo ?? "",
      away_logo: m.awayTeam?.logo ?? "",
      league: m.league?.name ?? "",
      round: m.round,
      venue: m.venue?.name ?? undefined,
      referee: m.referee?.name ?? undefined,
      forecast: m.forecast?.temperature ? { temperature: m.forecast.temperature, status: m.forecast.status ?? "" } : undefined,
      events: normalizeEvents(m.events ?? []),
      statistics: normalizeStats(m.statistics ?? []),
      predictions,
    };

    cache.set(key, { data: detail, ts: Date.now() });
    cache.set(key + ":ttl", { data: ttlForStatus(detail.status), ts: Date.now() });

    return detail;
  } catch (err: any) {
    console.error("[liveData] match detail error:", err.message);
    return null;
  }
}

export async function getLineups(matchId: string): Promise<MatchLineups | null> {
  const key = `lineups:${matchId}`;

  if (!isStale(key)) return cache.get(key)!.data;

  try {
    const result = await fetchHL<HLLineups>(`/lineups/${matchId}`);

    const lineups: MatchLineups = {
      home: normalizeLineup(result?.homeTeam ?? {}),
      away: normalizeLineup(result?.awayTeam ?? {}),
    };

    cache.set(key, { data: lineups, ts: Date.now() });
    cache.set(key + ":ttl", { data: TTL.live, ts: Date.now() });

    return lineups;
  } catch (err: any) {
    console.error("[liveData] lineups error:", err.message);
    return null;
  }
}

// Flush stale cache entries every 10min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (key.endsWith(":ttl")) continue;
    const ttl = cache.get(key + ":ttl")?.data ?? TTL.finished;
    if (now - entry.ts > ttl * 4) cache.delete(key);
  }
}, 600_000).unref();
