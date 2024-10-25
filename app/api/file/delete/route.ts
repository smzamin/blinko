import { prisma } from "@/server/prisma";
import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const POST = async (req: Request, res: NextResponse) => {
  try {
    const { attachment_path } = await req.json();
    console.log(attachment_path)
    const attachment = await prisma.attachments.findFirst({ where: { path: attachment_path } })
    if (attachment) {
      await prisma.attachments.delete({ where: { id: attachment.id } })
    }
    const filepath = path.join(process.cwd(), ".blinko/files/" + attachment_path.replace('/api/file/', ""))
    await unlink(filepath)
    return NextResponse.json({ Message: "Success", status: 200 });
  } catch (error) {
    return NextResponse.json({ Message: error?.message ?? "Internal server error", status: 500 });
  }
};