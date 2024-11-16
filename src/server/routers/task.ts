import { router, authProcedure, demoAuthMiddleware } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { DBJob } from '../plugins/dbjob';
import { ArchiveJob } from '../plugins/archivejob';
import { ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME, UPLOAD_FILE_PATH } from '@/lib/constant';
import { scheduledTaskSchema } from '@/lib/prismaZodType';
import { Memos } from '../plugins/memos';
import { unlink } from 'fs/promises';

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
  importFromBlinko: authProcedure.use(demoAuthMiddleware)
    .input(z.object({
      fileName: z.string()
    }))
    .mutation(async function* ({ input }) {
      const { fileName } = input
      try {
        const res = DBJob.RestoreDB(fileName)
        for await (const result of res) {
          yield result;
        }
        await unlink(UPLOAD_FILE_PATH + '/' + fileName)
      } catch (error) {
        await unlink(UPLOAD_FILE_PATH + '/' + fileName)
        throw new Error(error)
      }
    }),

  importFromMemos: authProcedure.use(demoAuthMiddleware)
    .input(z.object({
      fileName: z.string() //xxxx.db
    }))
    .mutation(async function* ({ input }) {
      try {
        const memos = new Memos();
        memos.initDB(input.fileName);
        for await (const result of memos.importMemosDB()) {
          yield result;
        }

        for await (const result of memos.importFiles()) {
          yield result;
        }
        memos.closeDB();
        await unlink(UPLOAD_FILE_PATH + '/' + input.fileName)
      } catch (error) {
        throw new Error(error)
      }
    }),
})
