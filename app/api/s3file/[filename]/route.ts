import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { stat } from "fs/promises";
import mime from "mime-types";
import { UPLOAD_FILE_PATH } from "@/lib/constant";
import { getGlobalConfig } from "@/server/routers/config";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const GET = async (req: Request, { params }: any) => {
  const config = await getGlobalConfig();
  const s3Client = new S3Client({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3AccessKeySecret,
    },
    forcePathStyle: true,
  });

  try {
    const command = new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: params.filename,
    });
    const response = await s3Client.send(command);
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