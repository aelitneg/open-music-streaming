import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getSession, type SessionResponse } from '@/lib/api';

export const sessionQueryKey = ['session'] as const;

// useQuery<T> wraps data in NoInfer<T>, which blocks discriminated union
// narrowing in consumers. The explicit return type strips that wrapper.
export function useSession(): UseQueryResult<SessionResponse> {
  return useQuery<SessionResponse>({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
