import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-guard";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/** قائمة الوسائط لمنتقي الصور في المحرر */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media:upload")) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const items = await prisma.media.findMany({
    where: can(user.role, "media:manage") ? {} : { uploadedById: user.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 24,
    take: 24,
    select: { id: true, url: true, alt: true, width: true, height: true },
  });
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
