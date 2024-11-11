import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import packageJson from '../../../package.json'
import axios from 'axios'
import { cache } from '@/lib/cache';
import { unfurl } from 'unfurl.js'
import { Metadata } from 'unfurl.js/dist/types';

export const publicRouter = router({
  version: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/version', summary: 'Update user config', tags: ['Public'] } })
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
    .meta({ openapi: { method: 'GET', path: '/v1/public/link-preview', summary: 'Get a link preview info', tags: ['Public'] } })
    .input(z.object({ url: z.string() }))
    .output(z.union([z.object({
      title: z.string(),
      favicon: z.string(),
      description: z.string()
    }), z.null()]))
    .query(async function ({ input }) {
      return await cache.wrap(input.url, async () => {
        try {
          const result: Metadata = await unfurl(input.url)
          return {
            title: result.title ?? '',
            favicon: result.favicon ?? '',
            description: result.description ?? ''
          }
        } catch (error) {
          return null
        }
      }, { ttl: 60 * 60 * 24 * 1000 })
    }),
})