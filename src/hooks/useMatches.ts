import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useMatches(params?: { status?: string; stage?: string }) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => api.getMatches(params),
  });
}

export function useNextMatch() {
  return useQuery({
    queryKey: ['matches', 'next'],
    queryFn: () => api.getNextMatch(),
    refetchInterval: 30_000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => api.getMatch(id),
    enabled: !!id,
  });
}

export function useMatchPickable(id: string) {
  return useQuery({
    queryKey: ['matches', id, 'pickable'],
    queryFn: () => api.getMatchPickable(id),
    enabled: !!id,
  });
}
