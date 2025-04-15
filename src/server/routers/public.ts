import { cache } from '@/lib/cache';
import { UPLOAD_FILE_PATH } from '@/lib/constant';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import pLimit from 'p-limit';
import { unfurl } from 'unfurl.js';
import { Metadata } from 'unfurl.js/dist/types';
import { z } from 'zod';
import packageJson from '../../../package.json';
import { prisma } from '../prisma';
import { publicProcedure, router } from '../trpc';
import { getGlobalConfig } from './config';
import { getWithProxy } from './helper/proxy';
import { SpotifyClient } from './helper/spotify';

const limit = pLimit(5);
let refreshTicker = 0;
let spotifyClient: SpotifyClient | null = null;

export const publicRouter = router({
  version: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/version', summary: 'Update user config', tags: ['Public'] } })
    .input(z.void())
    .output(z.string())
    .query(async function () {
      return await cache.wrap(
        'version',
        async () => {
          return packageJson.version;
        },
        { ttl: 60 * 60 * 1000 },
      );
    }),
  oauthProviders: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/oauth-providers', summary: 'Get OAuth providers info', tags: ['Public'] } })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          icon: z.string().optional(),
        }),
      ),
    )
    .query(async function () {
      const config = await getGlobalConfig({ useAdmin: true });
      return (config.oauth2Providers || []).map((provider) => ({
        id: provider.id,
        name: provider.name,
        icon: provider.icon,
      }));
    }),
  latestVersion: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/latest-version', summary: 'Get a new version', tags: ['Public'] } })
    .input(z.void())
    .output(z.string())
    .query(async function () {
      return await cache.wrap(
        'latest-version',
        async () => {
          const url = `https://api.github.com/repos/blinko-space/blinko/releases/latest`;
          try {
            const res = await getWithProxy(url, {
              config: {
                headers: {
                  'X-GitHub-Api-Version': '2022-11-28',
                  Accept: 'application/vnd.github+json',
                },
              },
            });
            const latestVersion = res.data.tag_name.replace('v', '');
            return latestVersion;
          } catch (error) {
            return '';
          }
        },
        { ttl: 60 * 10 * 1000 },
      );
    }),
  linkPreview: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/link-preview', summary: 'Get a link preview info', tags: ['Public'] } })
    .input(z.object({ url: z.string() }))
    .output(
      z.union([
        z.object({
          title: z.string(),
          favicon: z.string(),
          description: z.string(),
        }),
        z.null(),
      ]),
    )
    .query(async function ({ input }) {
      return cache.wrap(
        input.url,
        async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 5000);
            });
            const fetchPromise = limit(async () => {
              const result: Metadata = await unfurl(input.url);
              return {
                title: result?.title ?? '',
                favicon: result?.favicon ?? '',
                description: result?.description ?? '',
              };
            });
            const result: any = await Promise.race([fetchPromise, timeoutPromise]);
            return result;
          } catch (error) {
            console.error('Link preview error:', error);
            return {
              title: '',
              favicon: '',
              description: '',
            };
          }
        },
        { ttl: 60 * 60 * 1000 },
      );
    }),
  testWebhook: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/public/test-webhook', summary: 'Test webhook', tags: ['Public'] } })
    .input(
      z.object({
        data: z.any().optional(),
        webhookType: z.string().optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any().optional(),
      }),
    )
    .query(async function ({ input }) {
      console.log('test webhook', input, input.data?.attachments, input.data?.tags);
      return {
        success: true,
        data: input.data,
      };
    }),
  musicMetadata: publicProcedure
    .meta({
      openapi: { method: 'GET', path: '/v1/public/music-metadata', summary: 'Get music metadata', tags: ['Public'] },
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable',
        ETag: true,
      },
    })
    .input(z.object({ filePath: z.string() }))
    .output(
      z.object({
        coverUrl: z.string().optional(),
        trackName: z.string().optional(),
        albumName: z.string().optional(),
        artists: z.array(z.string()).optional(),
      }),
    )
    .query(async function ({ input }) {
      const config = await getGlobalConfig({ useAdmin: true });
      if (!config.spotifyConsumerKey && !config.spotifyConsumerSecret) {
        throw new Error('Spotify client not initialized');
      }
      return cache.wrap(
        input.filePath,
        async () => {
          let metadata: any = null;
          if (input.filePath.includes('/api/file/')) {
            const realFilePath = input.filePath.replace('/api/file', UPLOAD_FILE_PATH);
            const fileBuffer = await fs.promises.readFile(realFilePath);
            metadata = await mm.parseBuffer(new Uint8Array(fileBuffer), {
              mimeType: 'audio/mpeg',
              path: realFilePath,
            });
          } else if (input.filePath.includes('s3file')) {
            try {
              const response = await fetch(input.filePath);
              if (!response.ok) {
                throw new Error(`Failed to get presigned URL: ${response.statusText}`);
              }

              const presignedUrl = response.url;
              console.log('presignedUrl', { presignedUrl });
              const fileResponse = await fetch(presignedUrl);
              if (!fileResponse.ok) {
                throw new Error(`Failed to fetch file content: ${fileResponse.statusText}`);
              }

              const arrayBuffer = await fileResponse.arrayBuffer();
              metadata = await mm.parseBuffer(new Uint8Array(arrayBuffer), {
                mimeType: 'audio/mpeg',
              });
            } catch (error) {
              console.error('Failed to get s3 file metadata:', error);
              throw error;
            }
          }

          const artistName = metadata?.common?.artist?.trim();
          const trackName = metadata?.common?.title?.trim();

          if (!artistName || !trackName) {
            // console.log('Missing artist or track name');
            return {
              coverUrl: '',
              trackName: '',
              albumName: '',
              artists: [],
            };
          }

          if (!spotifyClient) {
            spotifyClient = new SpotifyClient({
              consumer: {
                key: config.spotifyConsumerKey!,
                secret: config.spotifyConsumerSecret!,
              },
            });
          }

          try {
            const coverUrl = await spotifyClient.getCoverArt(artistName, trackName);
            // console.log('Retrieved cover URL:', coverUrl);
            return {
              coverUrl,
              trackName: trackName,
              albumName: metadata?.common?.album || '',
              artists: [artistName],
            };
          } catch (err) {
            console.error('Failed to get music metadata:', err);
            return {
              coverUrl: '',
              trackName: trackName,
              albumName: metadata?.common?.album || '',
              artists: [artistName],
            };
          }
        },
        { ttl: 60 * 60 * 1000 * 24 * 365 },
      );
    }),
  siteInfo: publicProcedure
    .meta({
      openapi: { method: 'GET', path: '/v1/public/site-info', summary: 'Get site info', tags: ['Public'] },
    })
    .input(
      z
        .object({
          id: z.number().nullable().optional(),
        })
        .optional(),
    )
    .output(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        role: z.string().optional(),
      }),
    )
    .query(async function ({ input }) {
      return cache.wrap(
        input?.id ? input.id.toString() : 'superadmin-site-info',
        async () => {
          if (!input?.id || input?.id === null) {
            const superAdmin = await prisma.accounts.findFirst({ where: { role: 'superadmin' } });
            return {
              id: Number(superAdmin?.id),
              name: superAdmin?.nickname ?? superAdmin?.name ?? '',
              image: superAdmin?.image ?? '',
              description: superAdmin?.description ?? '',
              role: 'superadmin',
            };
          }
          const account = await prisma.accounts.findFirst({ where: { id: Number(input?.id) } });
          return {
            id: Number(account?.id),
            name: account?.nickname ?? account?.name ?? '',
            image: account?.image ?? '',
            description: account?.description ?? '',
            role: account?.role ?? 'user',
          };
        },
        { ttl: 1000 * 60 * 5 },
      ); // 5 minutes
    }),
  hubList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/hub-list', summary: 'Get hub list', tags: ['Public'] } })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          image: z.string(),
          description: z.string(),
        }),
      ),
    )
    .query(async function () {
      return [];
    }),
  hubSiteList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/public/hub-site-list', summary: 'Get hub site list from GitHub', tags: ['Public'] } })
    .input(
      z.object({
        search: z.string().optional(),
        refresh: z.boolean().optional(),
      }),
    )
    .output(
      z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          tags: z.array(z.string()).optional(),
          site_description: z.string().nullable().optional(),
          image: z.string().nullable().optional(),
          version: z.string().optional(),
        }),
      ),
    )
    .query(async function ({ input }) {
      if (input?.refresh) {
        refreshTicker++;
      }
      return await cache.wrap(
        `hub-site-list-${refreshTicker}`,
        async () => {
          try {
            //raw.gitmirror.com
            const response = await getWithProxy('https://raw.githubusercontent.com/blinko-space/blinko-hub/refs/heads/main/index.json', {
              config: {
                headers: {
                  Accept: 'application/vnd.github.v3.raw',
                },
              },
            });
            console.log('response', response.data);
            return response.data.sites;
          } catch (error) {
            console.error('Failed to fetch hub site list:', error);
            return [];
          }
        },
        { ttl: 60 * 60 * 12 * 1000 },
      );
    }),
  testHttpProxy: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/public/test-http-proxy', summary: 'Test HTTP proxy configuration', tags: ['Public'] } })
    .input(
      z.object({
        url: z.string().default('https://www.google.com'),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        responseTime: z.number(),
        statusCode: z.number().optional(),
        error: z.string().optional(),
        errorCode: z.string().optional(),
        errorDetails: z.any().optional(),
      }),
    )
    .mutation(async function ({ input }) {
      try {
        console.log(`[Server] Testing proxy connection to: ${input.url}`);
        const startTime = Date.now();

        const response = await getWithProxy(input.url, {
          useAdmin: true,
          config: {
            timeout: 20000,
            validateStatus: () => true,
          },
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`[Server] Proxy test success: ${response.status} in ${responseTime}ms`);

        return {
          success: response.status >= 200 && response.status < 400,
          message: `Successfully connected through proxy (${responseTime}ms)`,
          responseTime,
          statusCode: response.status,
        };
      } catch (error: any) {
        console.error('Proxy test error:', error);

        let errorMessage = 'Failed to connect through proxy';
        let errorCode = '';
        let errorDetails = {};

        if (error.code) {
          errorCode = error.code;
          errorDetails = {
            code: error.code,
            message: error.message,
          };

          if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset by proxy server. This could be due to security settings or network issues.';
          } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused. Please check if the proxy server is running and accessible.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Proxy host not found. Please check your proxy host settings.';
          } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. The proxy server took too long to respond.';
          } else if (error.code === 'EPROTO') {
            errorMessage = 'SSL/TLS protocol error. The proxy may not support secure connections.';
          }
        }

        if (error.proxyInfo) {
          errorDetails = {
            ...errorDetails,
            proxyInfo: error.proxyInfo,
          };
        }

        return {
          success: false,
          message: errorMessage,
          responseTime: -1,
          error: error instanceof Error ? error.message : String(error),
          errorCode,
          errorDetails,
        };
      }
    }),
});
