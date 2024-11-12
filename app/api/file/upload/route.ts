import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { stat, writeFile } from "fs/promises";
import { UPLOAD_FILE_PATH } from "@/lib/constant";
import sharp from 'sharp';

const writeFileSafe = async (baseName: string, extension: string, buffer: Buffer) => {
  let filename = encodeURIComponent(`${baseName}${extension}`)
  try {
    const exists = await stat(path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + filename));
    if (exists) {
      baseName = baseName + '_copy';
      return await writeFileSafe(baseName, extension, buffer)
    }
  } catch (error) {
    await writeFile(
      path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + filename),
      //@ts-ignore
      buffer
    );
    try {
      if ('jpeg/jpg/png/bmp/tiff/tif/webp/svg'.includes(extension.replace('.', '')?.toLowerCase() ?? null)) {
        await sharp(`${UPLOAD_FILE_PATH}/` + filename)
          .resize(500, 500)
          .toFile(UPLOAD_FILE_PATH + '/thumbnail_' + filename);
      }
    } catch (error) {
      console.error("Error thumbnail occurred ", error);
    }
    return filename
  }
}

export const POST = async (req: Request, res: NextResponse) => {
  const formData = await req.formData();
  const file = formData.getAll('file')[0]
  if (!file) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }
  if (process.env.IS_DEMO) {
    return NextResponse.json({ error: "In Demo App" }, { status: 401 });
  }
  //@ts-ignore
  const buffer = Buffer.from(await file.arrayBuffer());
  //@ts-ignore
  const originalName = file.name.replaceAll(" ", "_");
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  try {
    const filename = await writeFileSafe(baseName, extension, buffer)

    // const filePath = path.join(process.cwd(), "upload/", filename);
    return NextResponse.json({ Message: "Success", status: 200, filePath: `/api/file/${filename}`, fileName: filename });
  } catch (error) {
    console.log("Error occurred ", error);
    return NextResponse.json({ Message: "Failed", status: 500 });
  }
};
