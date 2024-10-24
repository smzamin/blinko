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
  canRegister: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/user/can-register' } })
    .input(z.void())
    .output(z.boolean())
    .mutation(async () => {
      const count = await prisma.accounts.count()
      console.log({ count })
      if (count > 0) {
        return false
      } else {
        return true
      }
    }),
  createAdmin: publicProcedure
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
