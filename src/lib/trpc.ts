import type { AppRouter } from '@/server/routers/_app';
import { createTRPCClient, httpBatchLink, httpBatchStreamLink, httpLink, splitLink } from '@trpc/client';
import superjson from 'superjson';

export const api = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url: `/api/trpc`,
        transformer: superjson
      }),
      // when condition is false, use batching
      false: httpBatchLink({
        url: `/api/trpc`,
        transformer: superjson
      }),
    })
  ],
});

export const streamApi = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: `/api/trpc`,
      transformer: superjson
    })
  ],
});

