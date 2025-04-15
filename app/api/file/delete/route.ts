import { FileService } from '@/server/routers/helper/files';
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { attachment_path } = await req.json();
    await FileService.deleteFile(attachment_path);
    return NextResponse.json({ Message: "Success", status: 200 });
  } catch (error) {
    return NextResponse.json({ Message: "Success", status: 200 });
  }
};