import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { can, STATUS_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { CoverImage } from "@/components/site/CoverImage";

export const metadata = { title: "معاينة المقال" };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("article:create");
  const { id } = await params;
  const a = await prisma.article.findUnique({ where: { id }, include: { author: true, category: true } });
  if (!a) notFound();
  if (!can(user.role, "article:edit:any") && a.authorId !== user.id) notFound();
  return (
    <article className="mx-auto max-w-3xl rounded-lg bg-white p-6 sm:p-10">
      <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">وضع المعاينة — الحالة: {STATUS_LABELS[a.status]}</p>
      {a.category && <p className="kicker">{a.category.name}</p>}
      <h1 className="mt-2 text-3xl leading-snug font-extrabold text-navy-900 sm:text-4xl">{a.title}</h1>
      {a.subtitle && <p className="mt-3 text-lg text-muted">{a.subtitle}</p>}
      <p className="mt-4 text-sm text-muted">بقلم {a.author.name} {a.publishedAt && `— ${formatDate(a.publishedAt)}`}</p>
      {a.coverImage && <CoverImage src={a.coverImage} alt={a.coverImageAlt} sizes="48rem" className="mt-6 aspect-[16/9] rounded-lg" />}
      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(a.content) }} />
    </article>
  );
}
