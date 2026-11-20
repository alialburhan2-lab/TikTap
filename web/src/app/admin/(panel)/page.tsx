import Link from "next/link";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { can, STATUS_LABELS } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { PageTitle } from "@/components/admin/PageTitle";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePermission("dashboard:view");
  const { denied } = await searchParams;
  const own = can(user.role, "article:edit:any") ? {} : { authorId: user.id };
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [byStatus, views30, subscribers, pendingComments, unread, recent] = await Promise.all([
    prisma.article.groupBy({ by: ["status"], where: own, _count: true }),
    can(user.role, "analytics:view") ? prisma.pageView.count({ where: { createdAt: { gte: since } } }) : Promise.resolve(null),
    can(user.role, "subscriber:manage") ? prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }) : Promise.resolve(null),
    can(user.role, "comment:moderate") ? prisma.comment.count({ where: { status: "PENDING" } }) : Promise.resolve(null),
    can(user.role, "message:manage") ? prisma.contactMessage.count({ where: { read: false } }) : Promise.resolve(null),
    prisma.article.findMany({
      where: own,
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, updatedAt: true, author: { select: { name: true } } },
    }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;

  const stats: { label: string; value: number | null; href?: string }[] = [
    { label: "مقالات منشورة", value: count("PUBLISHED"), href: "/admin/articles?status=PUBLISHED" },
    { label: "مسودات", value: count("DRAFT"), href: "/admin/articles?status=DRAFT" },
    { label: "قيد المراجعة", value: count("REVIEW"), href: "/admin/articles?status=REVIEW" },
    { label: "مجدولة", value: count("SCHEDULED"), href: "/admin/articles?status=SCHEDULED" },
    { label: "زيارات آخر 30 يوماً", value: views30, href: "/admin/analytics" },
    { label: "مشتركو النشرة", value: subscribers, href: "/admin/subscribers" },
    { label: "تعليقات بانتظار المراجعة", value: pendingComments, href: "/admin/comments" },
    { label: "رسائل غير مقروءة", value: unread, href: "/admin/messages" },
  ];

  return (
    <>
      {denied && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">ليست لديك صلاحية الوصول إلى تلك الصفحة.</p>}
      <PageTitle
        title={`مرحباً، ${user.name}`}
        description="نظرة عامة على المحتوى والنشاط."
        actions={<Link href="/admin/articles/new" className="btn-gold">+ كتابة مقال جديد</Link>}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.filter((s) => s.value !== null).map((s) => (
          <Link key={s.label} href={s.href ?? "#"} className="card p-5 transition hover:border-gold-500">
            <p className="text-xs font-bold text-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{formatNumber(s.value ?? 0)}</p>
          </Link>
        ))}
      </div>
      <section className="card mt-8">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-extrabold text-navy-900">آخر المقالات المعدّلة</h2>
          <Link href="/admin/articles" className="text-sm font-bold text-gold-600 hover:underline">كل المقالات</Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">لا توجد مقالات بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <Link href={`/admin/articles/${a.id}`} className="font-bold text-navy-900 hover:underline">{a.title}</Link>
                <span className="flex items-center gap-3 text-xs text-muted">
                  <StatusBadge status={a.status} label={STATUS_LABELS[a.status]} />
                  {a.author.name} — {formatDate(a.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
