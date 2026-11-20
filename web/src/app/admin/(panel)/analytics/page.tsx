import Link from "next/link";
import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { str } from "@/lib/params";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "إحصائيات الزيارات" };

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("analytics:view");
  const sp = await searchParams;
  const days = RANGES.includes(Number(str(sp.days))) ? Number(str(sp.days)) : 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [daily, totals, topArticles, referrers, devices] = await Promise.all([
    prisma.$queryRaw<{ day: Date; views: bigint; visitors: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors FROM "PageView" WHERE "createdAt" >= ${since}`,
    prisma.pageView.groupBy({ by: ["articleId"], where: { createdAt: { gte: since }, articleId: { not: null } }, _count: true, orderBy: { _count: { articleId: "desc" } }, take: 10 }),
    prisma.pageView.groupBy({ by: ["referrer"], where: { createdAt: { gte: since }, referrer: { not: null } }, _count: true, orderBy: { _count: { referrer: "desc" } }, take: 8 }),
    prisma.pageView.groupBy({ by: ["device"], where: { createdAt: { gte: since } }, _count: true }),
  ]);
  const articles = await prisma.article.findMany({
    where: { id: { in: topArticles.map((t) => t.articleId!) } },
    select: { id: true, title: true, slug: true, views: true },
  });

  // ملء الأيام الفارغة
  const map = new Map(daily.map((d) => [new Date(d.day).toISOString().slice(0, 10), { views: Number(d.views), visitors: Number(d.visitors) }]));
  const series: { date: string; views: number; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date: d, ...(map.get(d) ?? { views: 0, visitors: 0 }) });
  }
  const max = Math.max(1, ...series.map((s) => s.views));
  const total = totals[0] ?? { views: BigInt(0), visitors: BigInt(0) };
  const deviceTotal = devices.reduce((n, d) => n + d._count, 0) || 1;
  const DEVICE_LABELS: Record<string, string> = { mobile: "الهاتف", tablet: "الجهاز اللوحي", desktop: "الحاسوب" };

  return (
    <>
      <PageTitle
        title="إحصائيات الزيارات"
        description="إحصائيات تحترم الخصوصية: لا ملفات تعريف ارتباط ولا تخزين لعناوين IP."
        actions={RANGES.map((r) => (
          <Link key={r} href={`/admin/analytics?days=${r}`} className={`btn ${r === days ? "bg-navy-900 text-white" : "border border-line bg-white"}`}>
            آخر {formatNumber(r)} يوماً
          </Link>
        ))}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-bold text-muted">مشاهدات الصفحات</p><p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{formatNumber(Number(total.views))}</p></div>
        <div className="card p-5"><p className="text-xs font-bold text-muted">زوار فريدون (يومياً)</p><p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{formatNumber(Number(total.visitors))}</p></div>
        <div className="card p-5"><p className="text-xs font-bold text-muted">متوسط المشاهدات اليومية</p><p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{formatNumber(Math.round(Number(total.views) / days))}</p></div>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-extrabold text-navy-900">المشاهدات اليومية</h2>
        <div className="flex h-48 items-end gap-[2px]" role="img" aria-label="رسم بياني للمشاهدات اليومية">
          {series.map((s) => (
            <div key={s.date} className="group relative flex-1">
              <div className="w-full rounded-t bg-navy-800 transition group-hover:bg-gold-500" style={{ height: `${Math.max(2, (s.views / max) * 180)}px` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-navy-900 px-2 py-1 text-[10px] whitespace-nowrap text-white group-hover:block">
                {s.date}: {formatNumber(s.views)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted" dir="ltr"><span>{series[0]?.date}</span><span>{series.at(-1)?.date}</span></div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-extrabold text-navy-900">الأكثر قراءة في الفترة</h2>
          {topArticles.length === 0 ? <p className="text-sm text-muted">لا توجد بيانات بعد.</p> : (
            <ol className="divide-y divide-line text-sm">
              {topArticles.map((t, i) => {
                const a = articles.find((x) => x.id === t.articleId);
                if (!a) return null;
                return (
                  <li key={t.articleId} className="flex items-center justify-between gap-3 py-2.5">
                    <span><span className="ml-2 font-bold text-gold-600">{formatNumber(i + 1)}.</span><Link href={`/article/${a.slug}`} target="_blank" className="hover:underline">{a.title}</Link></span>
                    <span className="shrink-0 text-xs text-muted">{formatNumber(t._count)} مشاهدة</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-extrabold text-navy-900">الأجهزة</h2>
            <ul className="space-y-2 text-sm">
              {devices.map((d) => (
                <li key={d.device ?? "x"}>
                  <div className="flex justify-between"><span>{DEVICE_LABELS[d.device ?? ""] ?? "أخرى"}</span><span>{formatNumber(Math.round((d._count / deviceTotal) * 100))}٪</span></div>
                  <div className="mt-1 h-2 rounded bg-paper"><div className="h-2 rounded bg-gold-500" style={{ width: `${(d._count / deviceTotal) * 100}%` }} /></div>
                </li>
              ))}
              {devices.length === 0 && <li className="text-muted">لا توجد بيانات.</li>}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-extrabold text-navy-900">مصادر الزيارات</h2>
            <ul className="space-y-1.5 text-sm">
              {referrers.map((r) => (
                <li key={r.referrer} className="flex justify-between"><span dir="ltr">{r.referrer}</span><span className="text-muted">{formatNumber(r._count)}</span></li>
              ))}
              {referrers.length === 0 && <li className="text-muted">زيارات مباشرة فقط حتى الآن.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
