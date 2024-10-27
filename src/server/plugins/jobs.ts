import { CronJob } from "cron";
import path from 'path';
import fs from 'fs';
import Package from '../../../package.json';
import { $ } from 'execa';
import AdmZip from 'adm-zip'
import { DBBAK_TASK_NAME, DBBAKUP_PATH, ROOT_PATH, UPLOAD_FILE_PATH } from "@/lib/constant";
import { prisma } from "../prisma";
import { unlink } from "fs/promises";

export const Backupdb = async () => {
  try {
    // console.log(`pg_dump --dbname=${process.env.DATABASE_URL!} --format=custom --file=${DBBAKUP_PATH}/bak-v${Package.version}.sql --data-only --exclude-table=_prisma_migrations`)
    const { stdout, stderr } = await $`pg_dump --dbname=${process.env.DATABASE_URL!} --format=custom --file=${DBBAKUP_PATH}/bak.sql --data-only 
    --exclude-table=accounts --exclude-table=scheduledTask --exclude-table=_prisma_migrations`;
    // console.log({ stdout, stderr })
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

export const Resotredb = async (filePath) => {
  const zip = new AdmZip(UPLOAD_FILE_PATH + '/' + filePath);
  zip.extractAllTo(ROOT_PATH, true);
  const exists = fs.existsSync('.blinko/pgdump/bak.sql')
  if (!exists) {
    throw new Error("Your db file can not find restore file")
  }
  const { stdout, stderr } = await $`pg_restore --dbname=${process.env.DATABASE_URL!} .blinko/pgdump/bak.sql}`;
  if (stderr) {
    throw new Error(stderr)
  }
  return true
}

export const DBBackupJob = new CronJob('* * * * *', async () => {
  try {
    const res = await Backupdb()
    await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isSuccess: true, output: res, lastRun: new Date() } })
  } catch (error) {
    await prisma.scheduledTask.update({ where: { name: DBBAK_TASK_NAME }, data: { isSuccess: false, output: { error: error.message ?? 'internal error' } } })
  }
}, null, false);