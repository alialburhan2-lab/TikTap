import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashValue, isSameOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  path: z.string().startsWith("/").max(500),
  articleId: z.string().max(40).optional(),
  referrer: z.string().max(500).optional(),
});

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless/i;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { path, articleId, referrer } = parsed.data;
  if (path.startsWith("/admin")) return NextResponse.json({ ok: true, skipped: "admin" });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "local";
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = hashValue(`${ip}|${ua}|${day}`);
  if (!(await rateLimit(`views:${visitorHash}`, 120, 60 * 60 * 1000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const device = /mobile|android|iphone/i.test(ua) ? "mobile" : /ipad|tablet/i.test(ua) ? "tablet" : "desktop";

  let validArticleId: string | null = null;
  if (articleId) {
    const a = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    validArticleId = a?.id ?? null;
  }

  // زيارة فريدة يومياً لكل زائر ومقال
  let unique = true;
  if (validArticleId) {
    const startOfDay = new Date(`${day}T00:00:00.000Z`);
    const seen = await prisma.pageView.findFirst({
      where: { visitorHash, articleId: validArticleId, createdAt: { gte: startOfDay } },
      select: { id: true },
    });
    unique = !seen;
  }

  let ref: string | null = null;
  if (referrer) {
    try {
      const h = new URL(referrer).host;
      ref = h && h !== req.headers.get("host") ? h : null;
    } catch {
      ref = null;
    }
  }

  await prisma.pageView.create({ data: { path, articleId: validArticleId, visitorHash, referrer: ref, device } });
  if (validArticleId && unique) {
    await prisma.article.update({ where: { id: validArticleId }, data: { views: { increment: 1 } } });
  }
  return NextResponse.json({ ok: true, unique });
}
