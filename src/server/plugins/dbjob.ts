import { CronJob, CronTime } from "cron";
import path from 'path';
import fs from 'fs';
import Package from '../../../package.json';
import { $ } from 'execa';
import AdmZip from 'adm-zip'
import { ARCHIVE_BLINKO_TASK_NAME, DBBAK_TASK_NAME, DBBAKUP_PATH, ROOT_PATH, UPLOAD_FILE_PATH } from "@/lib/constant";
import { prisma } from "../prisma";
import { unlink } from "fs/promises";

export class DBJob {
  static Job = new CronJob('* * * * *', async () => {
    try {
      const res = await DBJob.RunTask()
      await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isSuccess: true, output: res, lastRun: new Date() } })
    } catch (error) {
      await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isSuccess: false, output: { error: error.message ?? 'internal error' } } })
    }
  }, null, false);

  static async RunTask() {
    try {
      const { stdout, stderr } = await $`pg_dump --dbname=${process.env.DATABASE_URL!} --format=custom --file=${DBBAKUP_PATH}/bak.sql --data-only 
      --exclude-table=accounts --exclude-table=scheduledTask --exclude-table=_prisma_migrations`;
      if (stderr) {
        if (!stderr.includes('unrecognized win32')) {
          throw new Error(stderr)
        }
      }
      const targetFile = UPLOAD_FILE_PATH + `/blinko_export.bko`
      try {
        await unlink(targetFile)
      } catch (error) {
      }
      const zip = new AdmZip();
      zip.addLocalFolder(ROOT_PATH);
      zip.writeZip(targetFile);
      return { apiPath: `/api/file/blinko_export.bko`, filePath: targetFile }
    } catch (error) {
      throw new Error(error)
    }
  }

  static async RestoreDB(filePath) {
    const zip = new AdmZip(UPLOAD_FILE_PATH + '/' + filePath);
    zip.extractAllTo(ROOT_PATH, true);
    const exists = fs.existsSync('.blinko/pgdump/bak.sql')
    if (!exists) {
      throw new Error("Your db file can not find restore file")
    }
    const { stdout, stderr } = await $`pg_restore --dbname=${process.env.DATABASE_URL!} .blinko/pgdump/bak.sql`;
    if (stderr) {
      throw new Error(stderr)
    }
    return true
  }

  static async Start(cronTime: string, immediate: boolean = true) {
    let success = false, output
    const hasTask = await prisma.scheduledTask.findFirst({ where: { name: DBBAK_TASK_NAME } })
    DBJob.Job.setTime(new CronTime(cronTime))
    DBJob.Job.start()
    if (immediate) {
      try {
        output = await DBJob.RunTask()
        success = true
      } catch (error) { output = error ?? (error.message ?? "internal error") }
    }
    if (!hasTask) {
      return await prisma.scheduledTask.create({ data: { lastRun: new Date(), output, isSuccess: success, schedule: cronTime, name: DBBAK_TASK_NAME, isRunning: DBJob.Job.running } })
    } else {
      return await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { lastRun: new Date(), output, isSuccess: success, schedule: cronTime, isRunning: DBJob.Job.running } })
    }
  }

  static async Stop() {
    DBJob.Job.stop()
    return await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isRunning: DBJob.Job.running } })
  }

  static async SetCornTime(cronTime: string) {
    DBJob.Job.setTime(new CronTime(cronTime))
    return await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { schedule: cronTime } })
  }
}