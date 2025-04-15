import { cache } from '@/lib/cache';
import { pluginSchema } from '@/lib/prismaZodType';
import axios from 'axios';
import { createWriteStream, existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import yauzl from 'yauzl-promise';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authProcedure, router } from '../trpc';
import { installPluginSchema, pluginInfoSchema } from '../types';
import { getHttpCacheKey, getWithProxy } from './helper/proxy';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Ensures the plugin directory exists
 */
const ensurePluginDir = async () => {
  const dir = path.join(process.cwd(), '.blinko', 'plugins');
  await ensureDirectoryExists(dir);
};

/**
 * Ensures that a directory exists
 */
const ensureDirectoryExists = async (dirPath: string) => {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Write a file ensuring its directory exists
 */
const writeFileWithDir = async (filePath: string, content: string) => {
  const dirPath = path.dirname(filePath);
  await ensureDirectoryExists(dirPath);
  await fs.writeFile(filePath, content);
};

const scanCssFiles = async (dirPath: string): Promise<string[]> => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const cssFiles: string[] = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        const subDirCssFiles = await scanCssFiles(fullPath);
        cssFiles.push(...subDirCssFiles.map(subFile => path.join(file.name, subFile)));
      } else if (file.name.endsWith('.css')) {
        cssFiles.push(file.name);
      }
    }

    return cssFiles;
  } catch (error) {
    console.error('Error scanning CSS files:', error);
    return [];
  }
};

async function downloadWithRetry(url: string, filePath: string, retries = MAX_RETRIES): Promise<void> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });
    await fs.writeFile(filePath, response.data);
  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return downloadWithRetry(url, filePath, retries - 1);
    }
    throw error;
  }
}


const getPluginDir = (pluginName: string) => {
  return path.join('.blinko', 'plugins', pluginName);
};

const cleanPluginDir = async (pluginName: string) => {
  const pluginDir = getPluginDir(pluginName);
  try {
    await fs.rm(pluginDir, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, ignore error
    console.debug(`Failed to clean plugin directory, might not exist: ${pluginName}`);
  }
};

export const pluginRouter = router({
  getAllPlugins: authProcedure.output(z.array(pluginInfoSchema)).query(async () => {
    return cache.wrap(
      `plugin-list-${await getHttpCacheKey()}`,
      async () => {
        try {
          const response = await getWithProxy('https://raw.githubusercontent.com/blinko-space/blinko-plugin-marketplace/main/index.json');
          return response.data;
        } catch (error) {
          console.error('Failed to fetch plugin list:', error);
          return [];
        }
      },
      {
        ttl: 5 * 60 * 1000,
      },
    );
  }),

  // Get CSS file contents for a plugin
  getPluginCssContents: authProcedure
    .input(
      z.object({
        pluginName: z.string(),
      }),
    )
    .output(z.array(z.object({
      fileName: z.string(),
      content: z.string()
    })))
    .query(async ({ input }) => {
      try {
        const pluginDir = path.join('.blinko', 'plugins', input.pluginName);
        if (!existsSync(pluginDir)) {
          return [];
        }

        const cssFiles = await scanCssFiles(pluginDir);
        const result: Array<{ fileName: string, content: string }> = [];

        for (const cssFile of cssFiles) {
          try {
            const filePath = path.join(pluginDir, cssFile);
            const content = await fs.readFile(filePath, 'utf-8');
            result.push({
              fileName: cssFile,
              content
            });
          } catch (error) {
            console.error(`Failed to read CSS file ${cssFile}:`, error);
          }
        }

        return result;
      } catch (error) {
        console.error(`Failed to get CSS contents for plugin ${input.pluginName}:`, error);
        return [];
      }
    }),

  saveDevPlugin: authProcedure
    .input(
      z.object({
        code: z.string(),
        fileName: z.string(),
        metadata: z.any(),
      }),
    )
    .output(z.any())
    .mutation(async function ({ input }) {
      try {
        // Clean dev plugin directory
        await cleanPluginDir('dev');

        // Rebuild directory and save file
        const devPluginDir = getPluginDir('dev');
        await ensureDirectoryExists(devPluginDir);

        const fullFilePath = path.join(devPluginDir, input.fileName);
        await writeFileWithDir(fullFilePath, input.code);

        return { success: true };
      } catch (error) {
        console.error('Save dev plugin error:', error);
        throw error;
      }
    }),

  // Save additional files for dev plugin
  saveAdditionalDevFile: authProcedure
    .input(
      z.object({
        filePath: z.string(),
        content: z.string(),
      }),
    )
    .output(z.any())
    .mutation(async function ({ input }) {
      try {
        // Save file
        const devPluginDir = getPluginDir('dev');
        const fullPath = path.join(devPluginDir, input.filePath);
        await writeFileWithDir(fullPath, input.content);

        return { success: true };
      } catch (error) {
        console.error(`Save additional dev file error: ${input.filePath}`, error);
        throw error;
      }
    }),

  installPlugin: authProcedure.input(installPluginSchema).mutation(async ({ input }) => {
    const pluginDir = getPluginDir(input.name);
    const tempZipPath = path.join(pluginDir, 'release.zip');

    try {
      // Check if plugin already exists
      const existingPlugin = await prisma.plugin.findFirst({
        where: {
          metadata: {
            path: ['name'],
            equals: input.name,
          },
        },
      });

      if (existingPlugin) {
        const metadata = existingPlugin.metadata as { version: string };
        if (metadata.version !== input.version) {
          await cleanPluginDir(input.name);
        } else {
          throw new Error(`Plugin v${metadata.version} is already installed`);
        }
      }

      // Create plugin directory and download files
      await ensureDirectoryExists(pluginDir);
      const releaseUrl = `${input.url}/releases/download/v${input.version}/release.zip`;

      // Use retry mechanism for download
      await downloadWithRetry(releaseUrl, tempZipPath);

      // Extract zip file
      const zipFile = await yauzl.open(tempZipPath);
      for await (const entry of zipFile) {
        if (entry.filename.endsWith('/')) {
          await fs.mkdir(path.join(pluginDir, entry.filename), { recursive: true });
          continue;
        }

        const targetPath = path.join(pluginDir, entry.filename);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        const readStream = await entry.openReadStream();
        const writeStream = createWriteStream(targetPath);

        await new Promise((resolve, reject) => {
          readStream.pipe(writeStream).on('finish', resolve).on('error', reject);
        });
      }

      await zipFile.close();
      await fs.unlink(tempZipPath);

      // Save to database
      return await prisma.$transaction(async (tx) => {
        if (existingPlugin) {
          return await tx.plugin.update({
            where: { id: existingPlugin.id },
            data: {
              metadata: input,
              path: `/plugins/${input.name}/index.js`,
            },
          });
        } else {
          return await tx.plugin.create({
            data: {
              metadata: input,
              path: `/plugins/${input.name}/index.js`,
              isUse: true,
              isDev: false,
            },
          });
        }
      });
    } catch (error) {
      // Clean up on error
      await cleanPluginDir(input.name);
      console.error('Install plugin error:', error);
      throw error;
    }
  }),

  getInstalledPlugins: authProcedure.output(z.array(pluginSchema)).query(async () => {
    const plugins = await prisma.plugin.findMany();
    return plugins;
  }),

  uninstallPlugin: authProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const plugin = await prisma.plugin.findUnique({
          where: { id: input.id },
        });

        if (!plugin) {
          throw new Error('Plugin not found');
        }

        const metadata = plugin.metadata as { name: string };

        // Delete plugin files
        await cleanPluginDir(metadata.name);

        // Delete from database
        await prisma.plugin.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        console.error('Uninstall plugin error:', error);
        throw error;
      }
    }),
});

ensurePluginDir().catch(console.error);
