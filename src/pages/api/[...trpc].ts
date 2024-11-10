import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';
import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'nextjs-cors';
import { createOpenApiNextHandler } from 'trpc-to-openapi';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res);
  if (!req.headers['content-type']) {
    req.headers['content-type'] = 'application/json';
  }
  return createOpenApiNextHandler({
    router: appRouter,
    createContext,
  })(req, res);
};

export default handler;