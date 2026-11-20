import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

/** شرط المقالات المرئية للجمهور: المنشورة والمجدولة التي حان موعدها */
export function publicWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  const now = new Date();
  return {
    AND: [
      { status: { in: ["PUBLISHED", "SCHEDULED"] }, publishedAt: { lte: now } },
      extra,
    ],
  };
}

export const cardSelect = {
  id: true,
  title: true,
  slug: true,
  subtitle: true,
  excerpt: true,
  coverImage: true,
  coverImageAlt: true,
  publishedAt: true,
  views: true,
  readingMinutes: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCard = Prisma.ArticleGetPayload<{ select: typeof cardSelect }>;

export async function getFeatured(): Promise<ArticleCard | null> {
  const featured = await prisma.article.findFirst({
    where: publicWhere({ featured: true }),
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
  });
  if (featured) return featured;
  return prisma.article.findFirst({ where: publicWhere(), orderBy: { publishedAt: "desc" }, select: cardSelect });
}

export async function getLatest(take = 6, excludeIds: string[] = []): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: publicWhere(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export async function getMostRead(take = 5): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: publicWhere(),
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take,
    select: cardSelect,
  });
}

export interface ListOptions {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
  from?: Date;
  to?: Date;
}

export async function listArticles(opts: ListOptions) {
  const perPage = Math.min(Math.max(opts.perPage ?? 12, 1), 48);
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const filters: Prisma.ArticleWhereInput[] = [];
  if (opts.categorySlug) filters.push({ category: { slug: opts.categorySlug } });
  if (opts.tagSlug) filters.push({ tags: { some: { tag: { slug: opts.tagSlug } } } });
  if (opts.from || opts.to) filters.push({ publishedAt: { ...(opts.from && { gte: opts.from }), ...(opts.to && { lt: opts.to }) } });
  const q = opts.query?.trim().slice(0, 100);
  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { contentText: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    });
  }
  const where = publicWhere(filters.length ? { AND: filters } : {});
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
  ]);
  return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export const getArticleBySlug = cache(async (slug: string) => {
  return prisma.article.findFirst({
    where: publicWhere({ slug }),
    include: {
      category: true,
      author: { select: { id: true, name: true, bio: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });
});

export async function getRelated(articleId: string, categoryId: string | null, take = 3) {
  return prisma.article.findMany({
    where: publicWhere({ id: { not: articleId }, ...(categoryId ? { categoryId } : {}) }),
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export const getNavCategories = cache(async () =>
  prisma.category.findMany({ where: { showInNav: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
);

/** أرشيف شهري: عدد المقالات لكل سنة/شهر */
export async function getArchiveBuckets(): Promise<{ year: number; month: number; count: number }[]> {
  const rows = await prisma.$queryRaw<{ year: number; month: number; count: bigint }[]>`
    SELECT EXTRACT(YEAR FROM "publishedAt")::int AS year,
           EXTRACT(MONTH FROM "publishedAt")::int AS month,
           COUNT(*) AS count
    FROM "Article"
    WHERE "status" IN ('PUBLISHED', 'SCHEDULED') AND "publishedAt" <= NOW()
    GROUP BY 1, 2
    ORDER BY 1 DESC, 2 DESC`;
  return rows.map((r) => ({ year: r.year, month: r.month, count: Number(r.count) }));
}
