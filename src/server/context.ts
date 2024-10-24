import type * as trpcNext from '@trpc/server/adapters/next';
import { getToken } from 'next-auth/jwt';

export async function createContext(
  opts: trpcNext.CreateNextContextOptions,
) {
  const token = await getToken({ req: opts.req, secret: process.env.NEXTAUTH_SECRE });
  if (!token?.sub) {
    return { ok: false };
  }
  return { ok: true }
}

export type Context = Awaited<ReturnType<typeof createContext>>;