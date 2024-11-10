import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { DBJob } from '../plugins/dbjob';
import { ArchiveJob } from '../plugins/archivejob';
import { ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME } from '@/lib/constant';
import { scheduledTaskSchema } from 'prisma/zod';

export const taskRouter = router({
  list: authProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/tasks/list', summary: 'Query user task list', protect: true, tags: ['Task'] } })
    .input(z.void())
    .output(z.array(scheduledTaskSchema))
    .query(async () => {
      return await prisma.scheduledTask.findMany()
    }),
  upsertTask: authProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/tasks/upsert', summary: 'Upsert Task', protect: true, tags: ['Task'] } })
    .input(z.object({
      time: z.string().optional(),
      type: z.enum(['start', 'stop', 'update']),
      task: z.enum([ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME]),
    }))
    .output(z.any())
    .mutation(async ({ input }) => {
      const { time, type, task } = input
      if (type == 'start' && time) {
        return task == DBBAK_TASK_NAME ? await DBJob.Start(time, true) : await ArchiveJob.Start(time, true)
      }
      if (type == 'stop') {
        return task == DBBAK_TASK_NAME ? await DBJob.Stop() : await ArchiveJob.Stop()
      }
      if (type == 'update' && time) {
        return task == DBBAK_TASK_NAME ? await DBJob.SetCornTime(time) : await ArchiveJob.SetCornTime(time)
      }
    }),
  restoreDB: authProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/tasks/restore-db', summary: 'Restore user data from .bko file', protect: true, tags: ['Task'] } })
    .input(z.object({
      fileName: z.string()
    }))
    .output(z.boolean())
    .query(async ({ input }) => {
      const { fileName } = input
      return DBJob.RestoreDB(fileName)
    }),
})
