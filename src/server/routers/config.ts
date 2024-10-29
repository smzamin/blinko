import { router, publicProcedure, authProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma';
import { GlobalConfig, ZConfigKey } from '../types';
export const getGlobalConfig = async () => {
  const config = await prisma.config.findMany()
  const globalConfig = config.reduce((acc, item) => {
    const config = item.config as { type: string, value: any }
    acc[item.key] = config.value
    return acc
  }, {})
  return globalConfig as GlobalConfig
}

export const configRouter = router({
  list: authProcedure
    .input(z.void())
    .query(async function () {
      return await getGlobalConfig()
    }),
  update: authProcedure
    .input(z.object({
      key: ZConfigKey,
      value: z.any()
    }))
    .mutation(async function ({ input }) {
      const { key, value } = input
      const hasKey = await prisma.config.findFirst({ where: { key } })
      if (hasKey) {
        return await prisma.config.update({ where: { id: hasKey.id }, data: { config: { type: typeof value, value } } })
      }
      return await prisma.config.create({ data: { key, config: { type: typeof value, value } } })
    }),
})
