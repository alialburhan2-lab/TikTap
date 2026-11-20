import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";
import { safeLocalPath } from "@/lib/storage/local";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", avif: "image/avif" };

/** يخدم الملفات المرفوعة محلياً بأمان (بدون تنفيذ أو استعراض مجلدات) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext];
  const full = type ? safeLocalPath(key) : null;
  if (!full) return new NextResponse("Not found", { status: 404 });
  try {
    const info = await stat(full);
    if (!info.isFile()) throw new Error();
    const data = await readFile(full);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
