export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { publicWhere } from "@/lib/articles";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, tags] = await Promise.all([
    prisma.article.findMany({ where: publicWhere({ isDemo: false }), select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" }, take: 45000 }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ where: { articles: { some: { article: publicWhere() } } }, select: { slug: true } }),
  ]);
  const now = new Date();
  const statics = ["", "/articles", "/archive", "/about", "/contact", "/privacy", "/terms"].map((p) => ({
    url: siteUrl(p || "/"),
    lastModified: now,
    changeFrequency: p === "" ? ("daily" as const) : ("weekly" as const),
    priority: p === "" ? 1 : 0.6,
  }));
  return [
    ...statics,
    ...categories.map((c) => ({ url: siteUrl(`/category/${encodeURIComponent(c.slug)}`), lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
    ...articles.map((a) => ({ url: siteUrl(`/article/${encodeURIComponent(a.slug)}`), lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...tags.map((t) => ({ url: siteUrl(`/tag/${encodeURIComponent(t.slug)}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
