import { NextRequest, NextResponse } from "next/server";
import { getGlobalConfig } from "@/server/routers/config";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { cache } from "@/lib/cache";

async function getS3Client() {
  const config = await getGlobalConfig();
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

export const GET = async (req: Request, { params }: any) => {
  const { s3ClientInstance, config } = await getS3Client();
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: params.filename,
    });
    const response = await s3ClientInstance.send(command);
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    return new NextResponse(response.Body?.transformToWebStream(), {
      headers,
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
};