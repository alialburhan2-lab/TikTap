import Link from "next/link";
import type { CommentStatus } from "@prisma/client";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { pageParam, str } from "@/lib/params";
import { deleteCommentAction, moderateCommentAction } from "@/actions/admin/engagement";
import { PageTitle } from "@/components/admin/PageTitle";
import { ConfirmAction, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "التعليقات" };

const TABS: { key: CommentStatus; label: string }[] = [
  { key: "PENDING", label: "بانتظار المراجعة" },
  { key: "APPROVED", label: "منشورة" },
  { key: "SPAM", label: "مزعجة" },
];

export default async function CommentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("comment:moderate");
  const sp = await searchParams;
  const status = (TABS.find((t) => t.key === str(sp.status))?.key ?? "PENDING") as CommentStatus;
  const page = pageParam(sp.page);
  const [counts, total, comments] = await Promise.all([
    prisma.comment.groupBy({ by: ["status"], _count: true }),
    prisma.comment.count({ where: { status } }),
    prisma.comment.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      include: { article: { select: { title: true, slug: true } } },
    }),
  ]);
  const back = `/admin/comments?status=${status}`;
  return (
    <>
      <Flash text={str(sp.msg)} />
      <PageTitle title="إدارة التعليقات" description="لا يظهر أي تعليق في الموقع قبل الموافقة عليه." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/comments?status=${t.key}`} className={`btn ${t.key === status ? "bg-navy-900 text-white" : "border border-line bg-white"}`}>
            {t.label} ({formatNumber(counts.find((c) => c.status === t.key)?._count ?? 0)})
          </Link>
        ))}
      </div>
      <div className="card divide-y divide-line">
        {comments.length === 0 && <p className="p-8 text-center text-muted">لا توجد تعليقات.</p>}
        {comments.map((c) => (
          <div key={c.id} className="space-y-2 p-4" data-testid="comment-row">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span><strong className="text-sm text-navy-900">{c.authorName}</strong> <span dir="ltr">({c.authorEmail})</span></span>
              <span>{formatDate(c.createdAt)} — على: <Link href={`/article/${c.article.slug}`} target="_blank" className="font-bold text-navy-800 hover:underline">{c.article.title}</Link></span>
            </div>
            <p className="text-sm leading-7 whitespace-pre-line">{c.content}</p>
            <div className="flex flex-wrap gap-2">
              {TABS.filter((t) => t.key !== status).map((t) => (
                <form key={t.key} action={moderateCommentAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value={t.key} />
                  <input type="hidden" name="back" value={back} />
                  <button className="btn-outline px-3 py-1.5 text-xs">
                    {t.key === "APPROVED" ? "موافقة ونشر" : t.key === "SPAM" ? "تعليم كمزعج" : "إرجاع للمراجعة"}
                  </button>
                </form>
              ))}
              <ConfirmAction action={deleteCommentAction} fields={{ id: c.id }} label="حذف" message="سيتم حذف التعليق نهائياً." />
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 20))} basePath="/admin/comments" params={{ status }} />
    </>
  );
}
