/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @link https://trpc.io/docs/v11/router
 * @link https://trpc.io/docs/v11/procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import superjson from 'superjson'
import { OpenApiMeta } from 'trpc-to-openapi';

const t = initTRPC.meta<OpenApiMeta>().context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authProcedure = t.procedure.use(async ({ctx, next}) => {
    if (!ctx.ok) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: 'Unauthorized'
        })
    }
    return next({
        ctx
    })
})

export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;