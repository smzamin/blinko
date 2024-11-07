import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import packageJson from '../../../package.json'
import axios from 'axios'
import { cache } from '@/lib/cache';
import { unfurl } from 'unfurl.js'

export const publicRouter = router({
  version: publicProcedure
    .input(z.void())
    .output(z.string())
    .query(async function () {
      return await cache.wrap('version', async () => {
        const url = `https://api.github.com/repos/blinko-space/blinko/releases/latest`;
        try {
          const res = await axios.get(url, {
            headers: {
              'X-GitHub-Api-Version': '2022-11-28',
              'Accept': 'application/vnd.github+json'
            },
          })
          const latestVersion = res.data.tag_name.replace('v', '');
          const currentVersion = packageJson.version;
          if (latestVersion !== currentVersion) {
            return latestVersion
          } else {
            return ''
          }
        } catch (error) {
          // console.error(error)
          return ''
        }
      }, { ttl: 60 * 60 * 1000 })
    }),
  linkPreview: publicProcedure
    .input(z.string())
    .query(async function ({ input }) {
      return await cache.wrap(input, async () => {
        try {
          const result = await unfurl(input)
          return result
        } catch (error) {
          return null
        }
      }, { ttl: 60 * 60 * 24 * 1000 })

    }),
})