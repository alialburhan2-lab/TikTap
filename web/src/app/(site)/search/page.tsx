import type { Metadata } from "next";
import { listArticles } from "@/lib/articles";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { dateParam, pageParam, str, type SearchParams } from "@/lib/params";
import { t } from "@/i18n";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleRow } from "@/components/site/ArticleCard";
import { Pagination } from "@/components/site/Pagination";

export const metadata: Metadata = {
  title: "البحث",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = str(sp.q)?.trim() ?? "";
  const category = str(sp.category) ?? "";
  const fromStr = str(sp.from) ?? "";
  const toStr = str(sp.to) ?? "";
  const from = dateParam(fromStr);
  const toDate = dateParam(toStr);
  const to = toDate ? new Date(toDate.getTime() + 86_400_000) : undefined;
  const hasQuery = !!(q || category || from || to);

  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const res = hasQuery
    ? await listArticles({ query: q, categorySlug: category || undefined, from, to, page: pageParam(sp.page), perPage: 10 })
    : null;

  return (
    <>
      <PageHeader kicker={t.nav.search} title={t.search.title} description="ابحث في عناوين المقالات ومحتواها، مع إمكانية التصفية حسب القسم والتاريخ." />
      <div className="container-page py-10">
        <form role="search" className="card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
          <div>
            <label htmlFor="q" className="label">كلمات البحث</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder={t.search.placeholder} className="input" maxLength={100} />
          </div>
          <div>
            <label htmlFor="category" className="label">القسم</label>
            <select id="category" name="category" defaultValue={category} className="input">
              <option value="">{t.search.allCategories}</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="from" className="label">{t.search.from}</label>
            <input id="from" name="from" type="date" defaultValue={fromStr} className="input" />
          </div>
          <div>
            <label htmlFor="to" className="label">{t.search.to}</label>
            <input id="to" name="to" type="date" defaultValue={toStr} className="input" />
          </div>
          <button type="submit" className="btn-primary">{t.search.submit}</button>
        </form>

        {res && (
          <section className="mt-8" aria-live="polite">
            <p className="mb-4 text-sm text-muted" data-testid="search-count">
              {formatNumber(res.total)} {t.search.results}
              {q && <> لـ «<strong className="text-navy-900">{q}</strong>»</>}
            </p>
            {res.items.length === 0 ? (
              <p className="card p-10 text-center text-muted">{t.search.none}</p>
            ) : (
              <div className="card px-5">
                {res.items.map((a) => <ArticleRow key={a.id} a={a} />)}
              </div>
            )}
            <Pagination page={res.page} totalPages={res.totalPages} basePath="/search" params={{ q, category, from: fromStr, to: toStr }} />
          </section>
        )}
      </div>
    </>
  );
}
