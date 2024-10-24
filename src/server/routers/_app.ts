/**
 * This file contains the root router of your tRPC-backend
 */
import { AnyProcedure, inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { notes } from '../share/initdata';
import { createCallerFactory, router } from '../trpc';
import { aiRouter } from './ai';
import { attachmentsRouter } from './attachment';
import { noteRouter } from './note';
import { tagRouter } from './tag';
import { userRouter } from './user';
import { configRouter } from './config';

export const appRouter = router({
  ai: aiRouter,
  notes: noteRouter,
  tags: tagRouter,
  users: userRouter,
  attachments: attachmentsRouter,
  config: configRouter
});

export const createCaller = createCallerFactory(appRouter);
export const caller = createCaller({ ok: true });

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;