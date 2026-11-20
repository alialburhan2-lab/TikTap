import Link from "next/link";
import type { ArticleStatus, Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { can, canDeleteArticle, canEditArticle, STATUS_LABELS } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, str } from "@/lib/params";
import { deleteArticleAction, setArticleStatusAction } from "@/actions/admin/articles";
import { PageTitle } from "@/components/admin/PageTitle";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmAction, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

const STATUSES = Object.keys(STATUS_LABELS) as ArticleStatus[];

export default async function AdminArticles({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePermission("article:create");
  const sp = await searchParams;
  const status = STATUSES.includes(str(sp.status) as ArticleStatus) ? (str(sp.status) as ArticleStatus) : undefined;
  const q = str(sp.q)?.trim();
  const categoryId = str(sp.category);
  const page = pageParam(sp.page);
  const perPage = 20;

  const where: Prisma.ArticleWhereInput = {
    ...(can(user.role, "article:edit:any") ? {} : { authorId: user.id }),
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }),
  };
  const [total, articles, categories] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, title: true, slug: true, status: true, publishedAt: true, updatedAt: true, views: true, featured: true, isDemo: true, authorId: true,
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const publisher = can(user.role, "article:publish");
  const back = `/admin/articles${status ? `?status=${status}` : ""}`;

  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle
        title="إدارة المقالات"
        description={`${formatNumber(total)} مقال`}
        actions={<Link href="/admin/articles/new" className="btn-gold">+ مقال جديد</Link>}
      />
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="ابحث بالعنوان أو الرابط…" className="input" aria-label="بحث" />
        <select name="status" defaultValue={status ?? ""} className="input" aria-label="الحالة">
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select name="category" defaultValue={categoryId ?? ""} className="input" aria-label="التصنيف">
          <option value="">كل التصنيفات</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-primary">تصفية</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="p-3">العنوان</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">الكاتب</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">القراءات</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {articles.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted">لا توجد مقالات مطابقة.</td></tr>
            )}
            {articles.map((a) => {
              const actor = { id: user.id, role: user.role };
              const editable = canEditArticle(actor, a);
              return (
                <tr key={a.id} className="align-top" data-testid="article-row">
                  <td className="max-w-xs p-3">
                    {editable ? (
                      <Link href={`/admin/articles/${a.id}`} className="font-bold text-navy-900 hover:underline">{a.title}</Link>
                    ) : (
                      <span className="font-bold text-navy-900">{a.title}</span>
                    )}
                    <div className="mt-1 flex gap-1">
                      {a.featured && <span className="badge bg-gold-100 text-gold-600">مميز</span>}
                      {a.isDemo && <span className="badge bg-amber-50 text-amber-800">تجريبي</span>}
                    </div>
                  </td>
                  <td className="p-3"><StatusBadge status={a.status} label={STATUS_LABELS[a.status]} /></td>
                  <td className="p-3">{a.category?.name ?? "—"}</td>
                  <td className="p-3">{a.author.name}</td>
                  <td className="p-3 text-xs text-muted">
                    {a.publishedAt ? formatDate(a.publishedAt) : "—"}
                    <div>عُدّل: {formatDate(a.updatedAt)}</div>
                  </td>
                  <td className="p-3">{formatNumber(a.views)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {editable && <Link href={`/admin/articles/${a.id}`} className="btn-outline px-3 py-1.5 text-xs">تعديل</Link>}
                      {(a.status === "PUBLISHED" || a.status === "SCHEDULED") && (
                        <Link href={`/article/${a.slug}`} target="_blank" className="btn-outline px-3 py-1.5 text-xs">عرض</Link>
                      )}
                      {publisher && a.status !== "PUBLISHED" && (
                        <form action={setArticleStatusAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="PUBLISHED" />
                          <input type="hidden" name="back" value={back} />
                          <button className="btn-outline px-3 py-1.5 text-xs text-green-700">نشر الآن</button>
                        </form>
                      )}
                      {publisher && a.status === "PUBLISHED" && (
                        <form action={setArticleStatusAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="ARCHIVED" />
                          <input type="hidden" name="back" value={back} />
                          <button className="btn-outline px-3 py-1.5 text-xs">أرشفة</button>
                        </form>
                      )}
                      {canDeleteArticle(actor, a) && (
                        <ConfirmAction
                          action={deleteArticleAction}
                          fields={{ id: a.id }}
                          label="حذف"
                          title="حذف المقال"
                          message={`هل أنت متأكد من حذف «${a.title}»؟ لا يمكن التراجع عن هذا الإجراء، وستُحذف التعليقات المرتبطة به.`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/articles" params={{ q, status, category: categoryId }} />
    </>
  );
}
