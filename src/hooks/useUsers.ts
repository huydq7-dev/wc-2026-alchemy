import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

// Shared user list — fetched once, cached for 30 minutes
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
