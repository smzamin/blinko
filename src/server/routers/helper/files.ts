import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { UPLOAD_FILE_PATH } from "@/lib/constant";
import fs, { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { cache } from "@/lib/cache";
import { Readable } from 'stream';
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from 'stream';
import { createWriteStream } from "fs";
import { getGlobalConfig } from '../config';
import { prisma } from '@/server/prisma';

export class FileService {
  public static async getS3Client() {
    const config = await getGlobalConfig({ useAdmin: true });
    return cache.wrap(`${config.s3Endpoint}-${config.s3Region}-${config.s3Bucket}-${config.s3AccessKeyId}-${config.s3AccessKeySecret}`, async () => {
      const s3ClientInstance = new S3Client({
        endpoint: config.s3Endpoint,
        region: config.s3Region,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3AccessKeySecret,
        },
        forcePathStyle: true,
      });
      return { s3ClientInstance, config };
    }, { ttl: 60 * 60 * 86400 * 1000 })
  }

  private static async writeFileSafe(baseName: string, extension: string, buffer: Buffer, attempt: number = 0) {
    const MAX_ATTEMPTS = 20;
    const config = await getGlobalConfig({ useAdmin: true });

    if (attempt >= MAX_ATTEMPTS) {
      throw new Error('MAX_ATTEMPTS_REACHED');
    }

    const sanitizeFileName = (name: string) => {
      try {
        const decodedName = decodeURIComponent(name);
        return decodedName
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, '_');
      } catch (error) {
        return name
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, '_');
      }
    };

    let filename = attempt === 0 ?
      `${sanitizeFileName(baseName)}${extension}` :
      `${sanitizeFileName(baseName)}_${Date.now()}${extension}`;

    let customPath = config.localCustomPath || '/';
    if (customPath) {
      customPath = customPath.startsWith('/') ? customPath : '/' + customPath;
      customPath = customPath.endsWith('/') ? customPath : customPath + '/';
    }

    try {
      const filePath = path.join(`${UPLOAD_FILE_PATH}${customPath}` + filename);
      await fs.access(filePath);
      return this.writeFileSafe(baseName, extension, buffer, attempt + 1);
    } catch (error) {
      const filePath = path.join(`${UPLOAD_FILE_PATH}${customPath}` + filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      try {
        //@ts-ignore
        await writeFile(filePath, buffer);
      } catch (error) {
        console.error('Error writing file:', error);
        throw error;
      }
      return `${customPath}${filename}`.replace(/^\//, '');
    }
  }

  static async uploadFile({
    buffer, originalName, type, withOutAttachment = false, accountId
  }: {
    buffer: Buffer, originalName: string, type: string, withOutAttachment?: boolean, accountId: number
  }) {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const config = await getGlobalConfig({ useAdmin: true });

    if (config.objectStorage === 's3') {
      const { s3ClientInstance } = await this.getS3Client();

      let customPath = config.s3CustomPath || '';
      if (customPath) {
        customPath = customPath.startsWith('/') ? customPath : '/' + customPath;
        customPath = customPath.endsWith('/') ? customPath : customPath + '/';
      }

      const timestampedFileName = `${baseName}_${timestamp}${extension}`;
      const s3Key = `${customPath}${timestampedFileName}`.replace(/^\//, '');

      const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: s3Key,
        Body: buffer,
      });

      await s3ClientInstance.send(command);
      const s3Url = `/api/s3file/${s3Key}`;
      if (!withOutAttachment) {
        await FileService.createAttachment({
          path: s3Url,
          name: FileService.getOriginFilename(timestampedFileName),
          size: buffer.length,
          type,
          accountId
        });
      }
      return { filePath: s3Url, fileName: FileService.getOriginFilename(timestampedFileName) };
    } else {
      const filename = await this.writeFileSafe(baseName, extension, buffer);
      await FileService.createAttachment({
        path: `/api/file/${filename}`,
        name: FileService.getOriginFilename(filename),
        size: buffer.length,
        type,
        accountId
      });
      return { filePath: `/api/file/${filename}`, fileName: FileService.getOriginFilename(filename) };
    }
  }

  static getOriginFilename(name: string) {
    const match = name.match(/-[^-]+(\.[^.]+)$/);
    return match ? match[0].substring(1) : name;
  }

  static async deleteFile(api_attachment_path: string) {
    const config = await getGlobalConfig({ useAdmin: true });
    if (api_attachment_path.includes('/api/s3file/')) {
      const { s3ClientInstance } = await this.getS3Client();
      const fileName = api_attachment_path.replace('/api/s3file/', "");
      const command = new DeleteObjectCommand({
        Bucket: config.s3Bucket,
        Key: fileName,
      });
      await s3ClientInstance.send(command);
      const attachmentPath = await prisma.attachments.findFirst({ where: { path: api_attachment_path } })
      if (attachmentPath) {
        await prisma.attachments.delete({ where: { id: attachmentPath.id } })
      }
    } else {
      const filepath = path.join(UPLOAD_FILE_PATH, api_attachment_path.replace('/api/file/', ""));
      const attachmentPath = await prisma.attachments.findFirst({ where: { path: api_attachment_path } })
      if (attachmentPath) {
        await prisma.attachments.delete({ where: { id: attachmentPath.id } })
      }
      await unlink(filepath);
    }
  }

  static async getFile(filePath: string) {
    const config = await getGlobalConfig({ useAdmin: true });
    const fileName = filePath.replace('/api/file/', '').replace('/api/s3file/', '');
    const tempPath = path.join(UPLOAD_FILE_PATH, path.basename(fileName));

    if (config.objectStorage === 's3') {
      const { s3ClientInstance } = await this.getS3Client();
      const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: fileName,
      });

      const response = await s3ClientInstance.send(command);
      const chunks: any[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      //@ts-ignore
      await fs.writeFile(tempPath, Buffer.concat(chunks));
      return tempPath;
    } else {
      return path.join(UPLOAD_FILE_PATH, fileName);
    }
  }

  static async uploadFileStream(
    {
      stream, originalName, fileSize, type, accountId
    }: {
      stream: ReadableStream, originalName: string, fileSize: number, type: string, accountId
    }) {
    const config = await getGlobalConfig({ useAdmin: true });
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const timestampedFileName = `${baseName}_${timestamp}${extension}`;

    try {
      if (config.objectStorage === 's3') {
        const { s3ClientInstance } = await this.getS3Client();

        let customPath = config.s3CustomPath || '';
        if (customPath) {
          customPath = customPath.startsWith('/') ? customPath : '/' + customPath;
          customPath = customPath.endsWith('/') ? customPath : customPath + '/';
        }

        const s3Key = `${customPath}${timestampedFileName}`.replace(/^\//, '');

        const passThrough = new PassThrough();
        const nodeReadable = Readable.fromWeb(stream as any);

        // Setup proper error handling
        nodeReadable.on('error', (err) => {
          passThrough.destroy(err);
        });

        nodeReadable.pipe(passThrough);

        const upload = new Upload({
          client: s3ClientInstance,
          params: {
            Bucket: config.s3Bucket,
            Key: s3Key,
            Body: passThrough,
          },
        });

        try {
          await upload.done();
        } catch (error) {
          // Ensure streams are destroyed on error
          passThrough.destroy();
          nodeReadable.destroy();
          throw error;
        }

        // Explicitly destroy streams after upload completes
        passThrough.destroy();
        nodeReadable.destroy();

        const s3Url = `/api/s3file/${s3Key}`;

        await FileService.createAttachment({
          path: s3Url,
          name: timestampedFileName,
          size: fileSize,
          type,
          accountId
        });
        return { filePath: s3Url, fileName: timestampedFileName };

      } else {
        let customPath = config.localCustomPath || '';
        if (customPath) {
          customPath = customPath.startsWith('/') ? customPath : '/' + customPath;
          customPath = customPath.endsWith('/') ? customPath : customPath + '/';
        }

        const fullPath = path.join(UPLOAD_FILE_PATH, customPath, timestampedFileName);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        const writeStream = createWriteStream(fullPath);
        const nodeReadable = Readable.fromWeb(stream as any);

        // Setup proper error handling
        nodeReadable.on('error', (err) => {
          writeStream.destroy(err);
        });

        writeStream.on('error', (err) => {
          nodeReadable.destroy();
          throw err;
        });

        await new Promise((resolve, reject) => {
          nodeReadable.pipe(writeStream)
            .on('finish', () => {
              // Ensure writeStream is properly closed
              writeStream.end();
              resolve(null);
            })
            .on('error', (err) => {
              // Clean up both streams on error
              writeStream.destroy();
              nodeReadable.destroy();
              reject(err);
            });
        });

        const relativePath = `${customPath}${timestampedFileName}`.replace(/^\//, '');
        await FileService.createAttachment({
          path: `/api/file/${relativePath}`,
          name: timestampedFileName,
          size: fileSize,
          type,
          noteId: null,
          accountId
        });
        return {
          filePath: `/api/file/${relativePath}`,
          fileName: timestampedFileName
        };
      }
    } catch (error) {
      console.error('Failed to upload file stream:', error);
      throw error;
    }
  }

  // path: /api/file/123/456/789.jpg
  static async createAttachment({
    path, name, size, type, noteId, accountId
  }: {
    path: string, name: string, size: number, type: string, noteId?: number | null, accountId: number
  }) {
    const pathParts = (path as string)
      .replace('/api/file/', '')
      .replace('/api/s3file/', '')
      .split('/');

    const prefixPath = pathParts.slice(0, -1).join(',');

    await prisma.attachments.create({
      data: {
        path,
        name,
        size,
        type,
        depth: pathParts.length - 1,
        perfixPath: prefixPath.startsWith(',') ? prefixPath.substring(1) : prefixPath,
        ...(noteId ? { noteId } : {}),
        accountId
      }
    })
  }

  static async renameFile(oldPath: string, newName: string) {
    const config = await getGlobalConfig({ useAdmin: true });

    await prisma.$transaction(async (prisma) => {
      if (oldPath.includes('/api/s3file/')) {
        const { s3ClientInstance } = await this.getS3Client();
        const oldKey = oldPath.replace('/api/s3file/', '');
        const dirPath = path.dirname(oldKey);

        const normalizedDirPath = dirPath === '.' ? '' : dirPath.replace(/\\/g, '/');
        const normalizedNewName = newName.replace(/\\/g, '/');
        const newKey = normalizedDirPath ? `${normalizedDirPath}/${normalizedNewName}` : normalizedNewName;

        try {
          await s3ClientInstance.send(new CopyObjectCommand({
            Bucket: config.s3Bucket,
            CopySource: encodeURIComponent(`${config.s3Bucket}/${decodeURIComponent(oldKey)}`),
            Key: decodeURIComponent(newKey)
          }));

          await s3ClientInstance.send(new DeleteObjectCommand({
            Bucket: config.s3Bucket,
            Key: decodeURIComponent(oldKey)
          }));
        } catch (error) {
          console.error('S3 rename operation failed:', error);
          throw new Error(`Failed to rename file in S3: ${error.message}`);
        }
      } else {
        const oldFilePath = path.join(UPLOAD_FILE_PATH, oldPath.replace('/api/file/', ''));
        const newFilePath = path.join(path.dirname(oldFilePath), newName);

        await fs.rename(oldFilePath, newFilePath);
      }
    });
  }

  static async moveFile(oldPath: string, newPath: string) {
    const config = await getGlobalConfig({ useAdmin: true });

    if (oldPath.includes('/api/s3file/')) {
      const { s3ClientInstance } = await this.getS3Client();
      const oldKey = oldPath.replace('/api/s3file/', '');
      let newKey = newPath.replace('/api/s3file/', '');

      if (newKey.startsWith('/')) {
        newKey = newKey.substring(1);
      }

      try {
        await s3ClientInstance.send(new GetObjectCommand({
          Bucket: config.s3Bucket,
          Key: decodeURIComponent(oldKey)
        }));
      } catch (error) {
        console.error('Source file check failed:', error);
        throw new Error(`Source file does not exist: ${decodeURIComponent(oldKey)}`);
      }

      try {
        await s3ClientInstance.send(new CopyObjectCommand({
          Bucket: config.s3Bucket,
          CopySource: encodeURIComponent(`${config.s3Bucket}/${decodeURIComponent(oldKey)}`),
          Key: decodeURIComponent(newKey)
        }));

        await s3ClientInstance.send(new DeleteObjectCommand({
          Bucket: config.s3Bucket,
          Key: decodeURIComponent(oldKey)
        }));
      } catch (error) {
        console.error('S3 operation failed:', error);
        throw new Error(`Failed to move file in S3: ${error.message}`);
      }
    } else {
      const oldFilePath = path.join(UPLOAD_FILE_PATH, oldPath.replace('/api/file/', ''));
      const newFilePath = path.join(UPLOAD_FILE_PATH, newPath.replace('/api/file/', ''));

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.rename(oldFilePath, newFilePath);

      try {
        const oldDir = path.dirname(oldFilePath);
        const files = await fs.readdir(oldDir);

        if (files.length === 0) {
          await fs.rmdir(oldDir);

          let parentDir = path.dirname(oldDir);
          const uploadPath = path.join(UPLOAD_FILE_PATH);
          while (parentDir !== uploadPath) {
            const parentFiles = await fs.readdir(parentDir);
            if (parentFiles.length === 0) {
              await fs.rmdir(parentDir);
              parentDir = path.dirname(parentDir);
            } else {
              break;
            }
          }
        }
      } catch (error) {
        console.error('Failed to cleanup old directories:', error);
      }
    }
  }
}

