import { z } from 'zod';
import { prisma } from '../prisma';
import { authProcedure, router } from '../trpc';

export const messageRouter = router({
  create: authProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      metadata: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await prisma.message.create({
        data: {
          content: input.content,
          role: input.role,
          conversationId: input.conversationId,
          metadata: input.metadata,
        }
      });
    }),

  list: authProcedure
    .input(z.object({
      conversationId: z.number(),
      page: z.number().default(1),
      size: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.size;
      const [total, messages] = await Promise.all([
        prisma.message.count({
          where: {
            conversationId: input.conversationId,
          }
        }),
        prisma.message.findMany({
          where: {
            conversationId: input.conversationId,
          },
          skip,
          take: input.size,
          orderBy: { createdAt: 'asc' }
        })
      ]);
      return messages;
    }),

  update: authProcedure
    .input(z.object({
      id: z.number(),
      content: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await prisma.message.update({
        where: {
          id: input.id,
        },
        data: {
          content: input.content,
        }
      });
    }),

  delete: authProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const message = await prisma.message.findUnique({
        where: {
          id: input.id,
        },
        select: {
          conversationId: true,
          createdAt: true,
        },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      return await prisma.$transaction(async (prisma) => {
        await prisma.message.delete({
          where: {
            id: input.id,
          },
        });

        await prisma.message.deleteMany({
          where: {
            conversationId: message.conversationId,
            createdAt: {
              gt: message.createdAt,
            },
          },
        });
      });
    }),
});