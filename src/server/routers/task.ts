import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { Backupdb, DBBackupJob, Resotredb } from '../plugins/jobs';
import { DBBAK_TASK_NAME } from '@/lib/constant';
import { CronTime } from 'cron';

export const taskRouter = router({
  list: authProcedure
    .input(z.void())
    .query(async () => {
      return await prisma.scheduledTask.findMany()
    }),
  startDBackupTask: authProcedure
    .input(z.object({
      time: z.string(),
      immediate: z.boolean().default(false)
    }))
    .query(async ({ input }) => {
      const { time, immediate } = input
      let success = false, output
      const hasTask = await prisma.scheduledTask.findFirst({ where: { name: DBBAK_TASK_NAME } })
      DBBackupJob.setTime(new CronTime(time))
      DBBackupJob.start()
      if (immediate) {
        try {
          output = await Backupdb()
          success = true
        } catch (error) { output = error ?? (error.message ?? "internal error") }
      }
      if (!hasTask) {
        await prisma.scheduledTask.create({ data: { lastRun: new Date(), output, isSuccess: success, schedule: time, name: DBBAK_TASK_NAME, isRunning: DBBackupJob.running } })
      } else {
        await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { lastRun: new Date(), output, isSuccess: success, schedule: time, isRunning: DBBackupJob.running } })
      }
      return null
    }),
  stopDBackupTask: authProcedure
    .input(z.void())
    .query(async () => {
      DBBackupJob.stop()
      await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isRunning: DBBackupJob.running } })
    }),
  updataDBackupTime: authProcedure
    .input(z.object({
      time: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { time } = input
      DBBackupJob.setTime(new CronTime(time))
      await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { schedule: time } })
    }),
  restoreDB: authProcedure
    .input(z.object({
      fileName: z.string()
    }))
    .query(async ({ input }) => {
      const { fileName } = input
      return Resotredb(fileName)
    }),
})
