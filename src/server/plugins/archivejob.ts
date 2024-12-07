import { CronJob, CronTime } from "cron";
import { ARCHIVE_BLINKO_TASK_NAME, } from "@/lib/constant";
import { prisma } from "../prisma";
import { adminCaller } from "../routers/_app";
import { NoteType } from "../types";

export class ArchiveJob {
  static Job = new CronJob('* * * * *', async () => {
    try {
      const res = await ArchiveJob.RunTask()
      await prisma.scheduledTask.update({ where: { name: ARCHIVE_BLINKO_TASK_NAME }, data: { isSuccess: true, output: res, lastRun: new Date() } })
    } catch (error) {
      await prisma.scheduledTask.update({ where: { name: ARCHIVE_BLINKO_TASK_NAME }, data: { isSuccess: false, output: { error: error.message ?? 'internal error' } } })
    }
  }, null, false);

  static async RunTask() {
    try {
      const config = await adminCaller.config.list()
      let autoArchivedDays = config.autoArchivedDays ?? 30
      const notes = await prisma.notes.findMany({
        where: {
          type: NoteType.BLINKO,
          createdAt: {
            lt: new Date(new Date().getTime() - autoArchivedDays * 24 * 60 * 60 * 1000)
          }
        },
      })
      return await prisma.notes.updateMany({ where: { id: { in: notes.map(e => e.id) } }, data: { isArchived: true } })
    } catch (error) {
      throw new Error(error)
    }
  }

  static async Start(cronTime: string, immediate: boolean = true) {
    let success = false, output
    const hasTask = await prisma.scheduledTask.findFirst({ where: { name: ARCHIVE_BLINKO_TASK_NAME } })
    ArchiveJob.Job.setTime(new CronTime(cronTime))
    ArchiveJob.Job.start()
    if (immediate) {
      try {
        output = await ArchiveJob.RunTask()
        success = true
      } catch (error) { output = error ?? (error.message ?? "internal error") }
    }
    if (!hasTask) {
      return await prisma.scheduledTask.create({ data: { lastRun: new Date(), output, isSuccess: success, schedule: cronTime, name: ARCHIVE_BLINKO_TASK_NAME, isRunning: ArchiveJob.Job.running } })
    } else {
      return await prisma.scheduledTask.update({ where: { name: ARCHIVE_BLINKO_TASK_NAME }, data: { lastRun: new Date(), output, isSuccess: success, schedule: cronTime, isRunning: ArchiveJob.Job.running } })
    }
  }

  static async Stop() {
    ArchiveJob.Job.stop()
    return await prisma.scheduledTask.update({ where: { name: ARCHIVE_BLINKO_TASK_NAME }, data: { isRunning: ArchiveJob.Job.running } })
  }

  static async SetCornTime(cronTime: string) {
    ArchiveJob.Job.setTime(new CronTime(cronTime))
    await this.Start(cronTime, true)
  }
}