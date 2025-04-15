/**
 * This file contains the root router of your tRPC-backend
 */
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { Context } from '../context';
import { router, t } from '../trpc';
import { analyticsRouter } from './analytics';
import { attachmentsRouter } from './attachment';
import { commentRouter } from './comment';
import { configRouter } from './config';
import { conversationRouter } from './conversation';
import { messageRouter } from './message';
import { noteRouter } from './note';
import { notificationRouter } from './notification';
import { pluginRouter } from './plugin';
import { publicRouter } from './public';
import { tagRouter } from './tag';
import { userRouter } from './user';

export const appRouter = router({
  notes: noteRouter,
  tags: tagRouter,
  users: userRouter,
  attachments: attachmentsRouter,
  config: configRouter,
  public: publicRouter,
  // task: lazy(() => import('./task')),
  analytics: analyticsRouter,
  comments: commentRouter,
  // follows: followsRouter,
  notifications: notificationRouter,
  plugin: pluginRouter,
  conversation: conversationRouter,
  message: messageRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

//not recommend to use this
export const adminCaller = createCaller({ id: '1', name: 'admin', sub: '1', role: 'superadmin', exp: 0, iat: 0 });

export const userCaller = (ctx: Context) => {
  return createCaller(ctx);
};

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
