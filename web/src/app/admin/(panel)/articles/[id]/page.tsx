import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { allowedStatuses, can, canEditArticle, STATUS_LABELS } from "@/lib/permissions";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "تعديل مقال" };

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requirePermission("article:create");
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const article = await prisma.article.findUnique({ where: { id }, include: { tags: { include: { tag: true } } } });
  if (!article) notFound();
  if (!canEditArticle({ id: user.id, role: user.role }, article)) redirect("/admin/articles?msg=" + encodeURIComponent("لا تملك صلاحية تعديل هذا المقال"));
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const statuses = allowedStatuses(user.role);

  return (
    <>
      <PageTitle
        title="تعديل المقال"
        actions={
          <>
            <StatusBadge status={article.status} label={STATUS_LABELS[article.status]} />
            {(article.status === "PUBLISHED" || article.status === "SCHEDULED") && (
              <Link href={`/article/${article.slug}`} target="_blank" className="btn-outline px-3 py-1.5 text-xs">عرض في الموقع</Link>
            )}
          </>
        }
      />
      <ArticleForm
        created={created === "1"}
        categories={categories}
        statuses={statuses.includes(article.status) ? statuses : [article.status, ...statuses]}
        canFeature={can(user.role, "article:publish")}
        values={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          subtitle: article.subtitle ?? "",
          excerpt: article.excerpt ?? "",
          content: article.content,
          coverImage: article.coverImage ?? "",
          coverImageAlt: article.coverImageAlt ?? "",
          categoryId: article.categoryId ?? "",
          tags: article.tags.map((t) => t.tag.name).join("، "),
          status: article.status,
          publishedAt: article.publishedAt?.toISOString() ?? null,
          featured: article.featured,
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
        }}
      />
    </>
  );
}
