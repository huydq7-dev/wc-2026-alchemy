import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { toast } from 'sonner';
import type { Prediction } from '@/types';

export function usePredictions(params?: { userId?: string; matchId?: string }) {
  return useQuery({
    queryKey: ['predictions', params],
    queryFn: () => api.getPredictions(params),
  });
}

export function usePlacePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; matchId: string; pick: 'A' | 'B' }) =>
      api.placePrediction(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        predicate: (query) =>
          query.queryKey[0] === 'predictions' && query.queryKey[1] !== 'history',
      });

      const previousPredictions = queryClient.getQueriesData<Prediction[]>({
        predicate: (query) =>
          query.queryKey[0] === 'predictions' && query.queryKey[1] !== 'history',
      });

      const optimisticPrediction: Prediction = {
        user_id: variables.userId,
        match_id: variables.matchId,
        pick: variables.pick,
        result: null,
        points: null,
      };

      previousPredictions.forEach(([queryKey, data]) => {
        const queryParams =
          typeof queryKey[1] === 'object' && queryKey[1] !== null ? queryKey[1] as {
            userId?: string;
            matchId?: string;
          } : undefined;

        if (queryParams?.userId && queryParams.userId !== variables.userId) return;
        if (queryParams?.matchId && queryParams.matchId !== variables.matchId) return;

        const next = (data ?? []).filter(
          (prediction) =>
            !(
              prediction.user_id === variables.userId &&
              prediction.match_id === variables.matchId
            )
        );

        queryClient.setQueryData<Prediction[]>(queryKey, [...next, optimisticPrediction]);
      });

      return { previousPredictions };
    },
    onError: (error: Error, _variables, context) => {
      context?.previousPredictions.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'predictions' && query.queryKey[1] !== 'history',
      });
      queryClient.invalidateQueries({ queryKey: ['matches', variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['pickStats'] });
      toast.success('Prediction placed!');
    },
  });
}

export function useUserHistory(userId: string) {
  return useQuery({
    queryKey: ['predictions', 'history', userId],
    queryFn: () => api.getUserHistory(userId),
    enabled: !!userId,
  });
}

export function usePickStats(matchIds: string[]) {
  const ids = matchIds.filter(Boolean);
  return useQuery({
    queryKey: ['pickStats', ids],
    queryFn: () => api.getPickStats(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
}
