import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { toast } from 'sonner';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success('Đặt cược thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
