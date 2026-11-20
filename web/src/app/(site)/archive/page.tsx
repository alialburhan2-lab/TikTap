import type { Metadata } from "next";
import Link from "next/link";
import { getArchiveBuckets, listArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { formatMonth, formatNumber } from "@/lib/format";
import { pageParam, str, type SearchParams } from "@/lib/params";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleListing } from "@/components/site/ArticleListing";

export const metadata: Metadata = {
  title: "أرشيف المنشورات",
  description: "الأرشيف الشهري والسنوي لجميع المنشورات.",
  alternates: { canonical: "/archive" },
};

export default async function ArchivePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const year = Number(str(sp.year)) || undefined;
  const monthRaw = Number(str(sp.month)) || undefined;
  const month = year && monthRaw && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : undefined;
  const validYear = year && year > 1900 && year < 3000 ? year : undefined;

  let from: Date | undefined;
  let to: Date | undefined;
  if (validYear) {
    from = new Date(Date.UTC(validYear, month ? month - 1 : 0, 1));
    to = month ? new Date(Date.UTC(validYear, month, 1)) : new Date(Date.UTC(validYear + 1, 0, 1));
  }

  const [buckets, settings] = await Promise.all([getArchiveBuckets(), getSettings()]);
  const res = await listArticles({ from, to, page: pageParam(sp.page), perPage: settings.postsPerPage });

  const years = new Map<number, { month: number; count: number }[]>();
  for (const b of buckets) {
    if (!years.has(b.year)) years.set(b.year, []);
    years.get(b.year)!.push({ month: b.month, count: b.count });
  }
  const heading = validYear ? (month ? formatMonth(validYear, month) : `عام ${formatNumber(validYear).replace(/٬/g, "")}`) : "كل المنشورات";

  return (
    <>
      <PageHeader kicker="الأرشيف" title="أرشيف المنشورات" description="تصفح المنشورات حسب السنة والشهر." />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="فهرس الأرشيف" className="space-y-4">
          <Link href="/archive" className={`block font-bold ${!validYear ? "text-gold-600" : "text-navy-900"}`}>كل المنشورات</Link>
          {[...years.entries()].map(([y, months]) => (
            <details key={y} open={y === validYear || (!validYear && y === buckets[0]?.year)} className="card p-4">
              <summary className="cursor-pointer font-display text-lg font-extrabold text-navy-900">
                <Link href={`/archive?year=${y}`}>{String(y)}</Link>
              </summary>
              <ul className="mt-3 space-y-1.5 text-sm">
                {months.map((m) => (
                  <li key={m.month}>
                    <Link
                      href={`/archive?year=${y}&month=${m.month}`}
                      className={`flex justify-between hover:text-gold-600 ${y === validYear && m.month === month ? "font-bold text-gold-600" : ""}`}
                    >
                      <span>{formatMonth(y, m.month)}</span>
                      <span className="text-muted">({formatNumber(m.count)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </aside>
        <div>
          <h2 className="section-title">{heading} <span className="text-sm font-medium text-muted">({formatNumber(res.total)} منشور)</span></h2>
          <ArticleListing
            {...res}
            basePath="/archive"
            params={{ year: validYear ? String(validYear) : undefined, month: month ? String(month) : undefined }}
            empty="لا توجد منشورات في هذه الفترة."
          />
        </div>
      </div>
    </>
  );
}
