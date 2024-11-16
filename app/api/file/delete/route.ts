import { UPLOAD_FILE_PATH } from "@/lib/constant";
import { prisma } from "@/server/prisma";
import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const POST = async (req: Request, res: NextResponse) => {
  try {
    const { attachment_path } = await req.json();
    const attachment = await prisma.attachments.findFirst({ where: { path: attachment_path } })
    if (attachment) {
      await prisma.attachments.delete({ where: { id: attachment.id } })
    }
    const filepath = path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + attachment_path.replace('/api/file/', ""))
    if ('jpeg/jpg/png/bmp/tiff/tif/webp/svg'.includes(attachment_path.replace('.', '')?.toLowerCase() ?? null)) {
      try {
        await unlink(path.join(process.cwd(), `${UPLOAD_FILE_PATH}/thumbnail_` + attachment_path.replace('/api/file/', "")))
      } catch (error) {
        // console.log(error)
      }
    }
    await unlink(filepath)
    return NextResponse.json({ Message: "Success", status: 200 });
  } catch (error) {
    return NextResponse.json({ Message: error?.message ?? "Internal server error", status: 500 });
  }
};