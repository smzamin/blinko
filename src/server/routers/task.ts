import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { DBJob } from '../plugins/dbjob';
import { ArchiveJob } from '../plugins/archivejob';
import { ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME } from '@/lib/constant';

export const taskRouter = router({
  list: authProcedure
    .input(z.void())
    .query(async () => {
      return await prisma.scheduledTask.findMany()
    }),
  upsertTask: authProcedure
    .input(z.object({
      time: z.string().optional(),
      type: z.enum(['start', 'stop', 'update']),
      task: z.enum([ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME]),
    }))
    .mutation(async ({ input }) => {
      const { time, type, task } = input
      if (type == 'start' && time) {
        return task == DBBAK_TASK_NAME ? DBJob.Start(time, true) : ArchiveJob.Start(time, true)
      }
      if (type == 'stop') {
        return task == DBBAK_TASK_NAME ? DBJob.Stop() : ArchiveJob.Stop()
      }
      if (type == 'update' && time) {
        return task == DBBAK_TASK_NAME ? DBJob.SetCornTime(time) : ArchiveJob.SetCornTime(time)
      }
    }),
  restoreDB: authProcedure
    .input(z.object({
      fileName: z.string()
    }))
    .query(async ({ input }) => {
      const { fileName } = input
      return DBJob.RestoreDB(fileName)
    }),
})
