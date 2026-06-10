import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

interface MatchInfo {
  teamA: string;
  teamB: string;
  date: string;
}

export function useLiveMatch({ teamA, teamB, date }: MatchInfo) {
  const hasTeams = !!teamA && !!teamB && !!date;

  // Step 1: fetch matches for the match date
  const matchesQuery = useQuery({
    queryKey: ["live", "matches", date],
    queryFn: () => api.getLiveMatches(date),
    enabled: hasTeams,
    refetchInterval: 60_000,
  });

  // Step 2: find the matching Highlightly match by team names (fuzzy)
  const hlMatch = matchesQuery.data?.matches?.find((m: any) => {
    const home = (m.home ?? "").toLowerCase();
    const away = (m.away ?? "").toLowerCase();
    const a = teamA.toLowerCase();
    const b = teamB.toLowerCase();
    return (home.includes(a) || a.includes(home)) && (away.includes(b) || b.includes(away));
  });

  // Step 3: fetch detail & lineups for the matched Highlightly match
  const detailQuery = useQuery({
    queryKey: ["live", "match", hlMatch?.id],
    queryFn: () => api.getLiveMatch(hlMatch!.id),
    enabled: !!hlMatch?.id,
    refetchInterval: (query) => {
      const status = query.state.data?.match?.status;
      return status === "live" || status === "1H" || status === "2H" || status === "HT" ? 30_000 : 120_000;
    },
  });

  const lineupsQuery = useQuery({
    queryKey: ["live", "lineups", hlMatch?.id],
    queryFn: () => api.getLiveLineups(hlMatch!.id),
    enabled: !!hlMatch?.id,
    refetchInterval: 120_000,
  });

  return {
    hlMatchId: hlMatch?.id,
    isLoading: matchesQuery.isLoading,
    detail: detailQuery.data?.match ?? null,
    lineups: lineupsQuery.data?.lineups ?? null,
    isLive: ["1H", "2H", "HT", "Live", "live"].includes(hlMatch?.status ?? ""),
    isFetching: detailQuery.isFetching,
  };
}
