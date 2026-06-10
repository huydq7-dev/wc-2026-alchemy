import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useMatches(params?: { status?: string; stage?: string }) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => api.getMatches(params),
    staleTime: 2 * 60 * 60 * 1000, // 2h — schedule rarely changes
  });
}

export function useNextMatch() {
  return useQuery({
    queryKey: ['matches', 'next'],
    queryFn: () => api.getNextMatch(),
    staleTime: 60_000, // 1min
    refetchInterval: 30_000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => api.getMatch(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5min — scores can change
  });
}

export function useMatchPickable(id: string) {
  return useQuery({
    queryKey: ['matches', id, 'pickable'],
    queryFn: () => api.getMatchPickable(id),
    enabled: !!id,
    staleTime: 60_000, // 1min
  });
}
