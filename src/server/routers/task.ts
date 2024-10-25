import { router, publicProcedure, authProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma';
import { encode } from 'next-auth/jwt';
import { Prisma } from '@prisma/client';
import { CronJob } from 'cron'
import { exec } from 'child_process';
import { pgDump, pgRestore } from "pg-dump-restore";
import { parse } from 'pg-connection-string'

//when you are in dev mode,you need to download and install command line tools and aad to env https://www.postgresql.org/download
const job = new CronJob('* * * * *', async () => {
  console.log("dump")
  var config = parse(process.env.DATABASE_URL!)
  const { stdout, stderr } = await pgDump(
    {
      port: Number(config.port!),
      host: config.host!,
      database: config.database!,
      username: config.user!,
      password: config.password!,
    },
    {
      filePath: './dump.sql'
    },
  );
  console.log({ stdout, stderr })
}, null, true);

export const taskRouter = router({
  createDBackupTask: authProcedure
    .input(z.void())
    .query(async () => {
      var config = parse(process.env.DATABASE_URL!)
      const { stdout, stderr } = await pgDump(
        {
          port: Number(config.port!),
          host: config.host!,
          database: config.database!,
          username: config.user!,
          password: config.password!,
        },
        {
          filePath: '.blinko/dump.sql'
        },
      );
      return
      const hasTask = await prisma.scheduledTask.findFirst({ where: { name: 'Backup Database' } })
      console.log({ hasTask })
      if (!hasTask) {
        console.log("0")
        job.start()
        console.log(job.running)
      }
    }),
  importDB: authProcedure
    .input(z.void())
    .query(async () => {
      var config = parse(process.env.DATABASE_URL!)
      const { stdout, stderr } = await pgRestore(
        {
          port: Number(config.port!),
          host: config.host!,
          database: config.database!,
          username: config.user!,
          password: config.password!,
        },
        {
          filePath: ".blinko/dump.sql",
        }
      ); 
    }),
})
