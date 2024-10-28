import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { stat } from "fs/promises";
import mime from "mime-types";
import { UPLOAD_FILE_PATH } from "@/lib/constant";

export const GET = async (req: Request, { params }: any) => {
  const { filename } = params;
  const encodeFileName = encodeURIComponent(filename)
  const filePath = path.join(process.cwd(), UPLOAD_FILE_PATH, encodeFileName);
  try {
    await stat(filePath);
    const fileContent = await readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeFileName}"`,
      },
    });
  } catch (error) {
    console.error("Error occurred ", error);
    return NextResponse.json({ Message: "File not found", status: 404 });
  }
};