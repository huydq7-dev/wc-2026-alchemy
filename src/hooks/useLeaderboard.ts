import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getLeaderboard(),
    refetchInterval: 30_000,
  });
}
