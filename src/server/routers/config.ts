import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { GlobalConfig, ZConfigKey, ZConfigSchema } from '../types';
import { configSchema } from 'prisma/zod';

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
    .meta({ openapi: { method: 'GET', path: '/v1/config/list', summary: 'Query user config list', protect: true, tags: ['Config'] } })
    .input(z.void())
    .output(ZConfigSchema)
    .query(async function () {
      console.log(await getGlobalConfig())
      return await getGlobalConfig()
    }),
  update: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/config/update', summary: 'Update user config', protect: true, tags: ['Config'] } })
    .input(z.object({
      key: ZConfigKey,
      value: z.any()
    }))
    .output(configSchema)
    .mutation(async function ({ input }) {
      const { key, value } = input
      const hasKey = await prisma.config.findFirst({ where: { key } })
      if (hasKey) {
        return await prisma.config.update({ where: { id: hasKey.id }, data: { config: { type: typeof value, value } } })
      }
      return await prisma.config.create({ data: { key, config: { type: typeof value, value } } })
    }),
})
