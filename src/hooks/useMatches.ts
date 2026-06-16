import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { getEffectiveStatus } from '@/lib/utils';
import type { Match } from '@/types';

export function useMatches(params?: { status?: string; stage?: string }) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => api.getMatches(params),
    staleTime: 60_000, // 1min — allow refetch when scores change
    refetchInterval: (data) => {
      if (!data || !Array.isArray(data)) return false;
      const hasLive = data.some(
        (m: Match) => getEffectiveStatus(m.status, m.date, m.time) === 'live',
      );
      return hasLive ? 60_000 : false;
    },
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
    staleTime: 30_000, // 30s — scores change during live
    refetchInterval: (data) => {
      if (!data || !data.status) return false;
      return getEffectiveStatus(data.status, data.date, data.time) === 'live' ? 60_000 : false;
    },
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
