import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

interface MatchInfo {
  teamA: string;
  teamB: string;
  date: string;
}

const STALE_MATCHES = 600_000; // 10 min — match list per date is stable
const STALE_DETAIL_LIVE = 60_000; // 1 min — live detail changes
const STALE_DETAIL = 300_000; // 5 min — upcoming/finished detail
const STALE_LINEUPS = 1_800_000; // 30 min — lineups don't change once published
const STALE_STATS = 86_400_000; // 24 h — finished stats never change

const GC = 3_600_000; // 1 h — keep unused data in cache

export function useLiveMatch({ teamA, teamB, date }: MatchInfo) {
  const hasTeams = !!teamA && !!teamB && !!date;

  // Step 1: fetch matches for the match date
  const matchesQuery = useQuery({
    queryKey: ['live', 'matches', date],
    queryFn: () => api.getLiveMatches(date),
    enabled: hasTeams,
    staleTime: STALE_MATCHES,
    gcTime: GC,
    refetchInterval: STALE_MATCHES,
  });

  // Step 2: find the matching Highlightly match by team names (fuzzy)
  const hlMatch = matchesQuery.data?.matches?.find((m: any) => {
    const home = (m.home ?? '').toLowerCase();
    const away = (m.away ?? '').toLowerCase();
    const a = teamA.toLowerCase();
    const b = teamB.toLowerCase();
    return (home.includes(a) || a.includes(home)) && (away.includes(b) || b.includes(away));
  });

  const isLive = ['1H', '2H', 'HT', 'Live', 'live'].includes(hlMatch?.status ?? '');
  const isFinished = hlMatch?.status === 'Finished';

  // Step 3: fetch detail for the matched Highlightly match
  const detailQuery = useQuery({
    queryKey: ['live', 'match', hlMatch?.id],
    queryFn: () => api.getLiveMatch(hlMatch!.id),
    enabled: !!hlMatch?.id,
    staleTime: isLive ? STALE_DETAIL_LIVE : STALE_DETAIL,
    gcTime: GC,
    refetchInterval: isLive ? 60_000 : 300_000,
  });

  // Step 4: lineups — only for upcoming/live, skip for finished
  const lineupsQuery = useQuery({
    queryKey: ['live', 'lineups', hlMatch?.id],
    queryFn: () => api.getLiveLineups(hlMatch!.id),
    enabled: !!hlMatch?.id && !isFinished,
    staleTime: STALE_LINEUPS,
    gcTime: GC,
    refetchInterval: STALE_LINEUPS,
  });

  // Step 5: stats — only for finished matches (server caches 24h)
  const statsQuery = useQuery({
    queryKey: ['live', 'stats', hlMatch?.id],
    queryFn: () => api.getLiveStats(hlMatch!.id),
    enabled: !!hlMatch?.id && isFinished,
    staleTime: STALE_STATS,
    gcTime: GC,
  });

  return {
    hlMatchId: hlMatch?.id,
    isLoading: matchesQuery.isLoading,
    detail: detailQuery.data?.match ?? null,
    lineups: lineupsQuery.data?.lineups ?? null,
    stats: statsQuery.data?.statistics ?? null,
    isLive,
    isFetching: detailQuery.isFetching,
  };
}
