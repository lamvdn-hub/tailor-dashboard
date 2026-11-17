import { QueryClient } from '@tanstack/react-query';
import { errorCode } from '@/lib/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => errorCode(error) === null && count < 2,
    },
  },
});
