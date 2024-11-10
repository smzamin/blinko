import { router, publicProcedure, authProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma';
import { encode } from 'next-auth/jwt';
import { Prisma } from '@prisma/client';

const genToken = async ({ id, name }: { id: number, name: string, }) => {
  return await encode({
    token: {
      name,
      sub: id.toString(),
    },
    secret: process.env.NEXTAUTH_SECRET!
  })
}

export const userRouter = router({
  detail: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/user/detail', summary: 'Find user detail from user id', tags: ['User'] } })
    .input(z.object({ id: z.number() }))
    .output(z.object({
      id: z.number(),
      name: z.string(),
      nickName: z.string(),
      token: z.string()
    }))
    .query(async ({ input }) => {
      const user = await prisma.accounts.findFirst({ where: { id: input.id } })
      return {
        id: input.id,
        name: user?.name ?? '',
        nickName: user?.nickname ?? '',
        token: user?.apiToken ?? ''
      }
    }),
  canRegister: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/can-register', summary: 'Check if can register admin', tags: ['User'] } })
    .input(z.void())
    .output(z.boolean())
    .mutation(async () => {
      const count = await prisma.accounts.count()
      if (count > 0) {
        return false
      } else {
        return true
      }
    }),
  createAdmin: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/create-admin', summary: 'Create admin user', tags: ['User'] } })
    .input(z.object({
      name: z.string(),
      password: z.string()
    }))
    .output(z.boolean())
    .mutation(async ({ input }) => {
      return prisma.$transaction(async () => {
        const { name, password } = input
        const count = await prisma.accounts.count()
        if (count > 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'You have already create admin account',
          });
        }
        const res = await prisma.accounts.create({ data: { name, password, nickname: name } })
        await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name }) } })
        return true
      })
    }),
  upsertUser: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/upsert', summary: 'Update or create user', tags: ['User'] } })
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      password: z.string().optional(),
      nickname: z.string().optional()
    }))
    .output(z.boolean())
    .mutation(async ({ input }) => {
      return prisma.$transaction(async () => {
        const { id, nickname, name, password } = input
        const update: Prisma.accountsUpdateInput = {}
        if (id) {
          if (name) update.name = name
          if (password) update.password = password
          if (nickname) update.nickname = nickname
          await prisma.accounts.update({ where: { id }, data: update })
          return true
        } else {
          const res = await prisma.accounts.create({ data: { name, password, nickname: name } })
          await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name: name ?? '' }) } })
          return true
        }
      })
    })
})
