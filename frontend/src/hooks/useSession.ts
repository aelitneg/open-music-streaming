import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/lib/api';

export const sessionQueryKey = ['session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
