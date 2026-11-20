import { randomBytes } from "crypto";
import type { Article, ArticleStatus } from "@prisma/client";
import { prisma } from "../db";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { allowedStatuses, can, canDeleteArticle, canEditArticle, type Actor } from "../permissions";
import { htmlToText, readingMinutes, sanitizeArticleHtml } from "../sanitize";
import { slugify } from "../slug";
import { articleSchema, fieldErrors } from "../validation";
import { resolveTagIds } from "./tags";

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || `article-${randomBytes(3).toString("hex")}`;
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const found = await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

function resolvePublishing(
  status: ArticleStatus,
  requested: Date | null,
  existing: Date | null | undefined,
): { status: ArticleStatus; publishedAt: Date | null } {
  const now = new Date();
  switch (status) {
    case "PUBLISHED": {
      const at = requested ?? existing ?? now;
      // نشر بتاريخ مستقبلي = جدولة
      return at.getTime() > now.getTime() ? { status: "SCHEDULED", publishedAt: at } : { status, publishedAt: at };
    }
    case "SCHEDULED":
      return { status, publishedAt: requested };
    case "ARCHIVED":
      return { status, publishedAt: existing ?? requested ?? null };
    default:
      return { status, publishedAt: requested ?? null };
  }
}

/**
 * إنشاء أو تعديل مقال مع تطبيق الصلاحيات والتحقق والتنظيف على الخادم.
 * @param raw بيانات النموذج الخام
 */
export async function saveArticle(actor: Actor, raw: Record<string, unknown>, id?: string): Promise<Article> {
  const parsed = articleSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationError(fieldErrors(parsed.error));
  const input = parsed.data;

  const existing = id ? await prisma.article.findUnique({ where: { id } }) : null;
  if (id && !existing) throw new NotFoundError("المقال غير موجود");
  if (existing) {
    if (!canEditArticle(actor, existing)) throw new ForbiddenError("لا تملك صلاحية تعديل هذا المقال");
  } else if (!can(actor.role, "article:create")) {
    throw new ForbiddenError("لا تملك صلاحية إنشاء المقالات");
  }

  if (!allowedStatuses(actor.role).includes(input.status)) {
    throw new ForbiddenError("لا تملك صلاحية نشر أو جدولة أو أرشفة المقالات. يمكنك إرسال المقال للمراجعة.");
  }

  if (input.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!cat) throw new ValidationError({ categoryId: "التصنيف غير موجود" });
  }

  const content = sanitizeArticleHtml(input.content);
  const text = htmlToText(content);
  const slug = await uniqueSlug(input.slug ?? slugify(input.title), existing?.id);
  const { status, publishedAt } = resolvePublishing(input.status, input.publishedAt, existing?.publishedAt);
  const featured = can(actor.role, "article:publish") ? input.featured : (existing?.featured ?? false);

  const data = {
    title: input.title,
    slug,
    subtitle: input.subtitle,
    excerpt: input.excerpt ?? (text ? text.slice(0, 220) + (text.length > 220 ? "…" : "") : null),
    content,
    contentText: text,
    coverImage: input.coverImage,
    coverImageAlt: input.coverImageAlt,
    categoryId: input.categoryId,
    status,
    publishedAt,
    featured,
    readingMinutes: readingMinutes(text),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };

  return prisma.$transaction(async (tx) => {
    const tagIds = await resolveTagIds(tx, input.tags);
    if (featured) {
      // مقال مميز واحد فقط في الصفحة الرئيسية
      await tx.article.updateMany({ where: { featured: true, ...(existing ? { id: { not: existing.id } } : {}) }, data: { featured: false } });
    }
    const article = existing
      ? await tx.article.update({ where: { id: existing.id }, data })
      : await tx.article.create({ data: { ...data, authorId: actor.id } });
    await tx.articleTag.deleteMany({ where: { articleId: article.id } });
    if (tagIds.length) {
      await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: article.id, tagId })) });
    }
    return article;
  });
}

export async function deleteArticle(actor: Actor, id: string): Promise<void> {
  const existing = await prisma.article.findUnique({ where: { id }, select: { authorId: true, status: true } });
  if (!existing) throw new NotFoundError("المقال غير موجود");
  if (!canDeleteArticle(actor, existing)) throw new ForbiddenError("لا تملك صلاحية حذف هذا المقال");
  await prisma.article.delete({ where: { id } });
}

/** تغيير سريع للحالة (نشر/أرشفة) من قائمة المقالات */
export async function setArticleStatus(actor: Actor, id: string, status: ArticleStatus): Promise<Article> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("المقال غير موجود");
  if (!canEditArticle(actor, existing)) throw new ForbiddenError("لا تملك صلاحية تعديل هذا المقال");
  if (!allowedStatuses(actor.role).includes(status)) throw new ForbiddenError("لا تملك صلاحية هذا الإجراء");
  if (status === "SCHEDULED") throw new ValidationError({ status: "استخدم محرر المقال لتحديد موعد الجدولة" });
  const now = new Date();
  const keepDate = existing.publishedAt && existing.publishedAt <= now ? existing.publishedAt : null;
  const resolved = resolvePublishing(status, status === "PUBLISHED" ? (keepDate ?? now) : null, keepDate ?? existing.publishedAt);
  return prisma.article.update({ where: { id }, data: resolved });
}
