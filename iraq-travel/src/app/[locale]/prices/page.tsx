import type { Metadata } from "next";
import { PageHero } from "@/components/cards";
import { DemoBadge, Notice, StatusBadge } from "@/components/badges";
import { FilterBar } from "@/components/filter-bar";
import { PRICE_CATEGORIES } from "@/data/types";
import { getGovernorates, getSourcesById, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { formatDate, isStale, tr } from "@/lib/localize";
import { formatIqd, formatUsd, toIqd, toUsd } from "@/lib/money";
import { iqdPerUsd } from "@/lib/env";
import { fmt } from "@/i18n/dictionary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/prices", t.prices.title, t.prices.intro);
}

export default async function PricesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const { category } = await searchParams;
  const [prices, governorates, sources] = await Promise.all([listPublic("priceRecords"), getGovernorates(), getSourcesById()]);
  const govById = new Map(governorates.map((g) => [g.id, g]));
  const rate = iqdPerUsd();
  const list = prices.filter((p) => !category || p.category === category).sort((a, b) => a.category.localeCompare(b.category));
  const both = (v: number, cur: "IQD" | "USD") => (
    <span className="block leading-tight"><span className="font-semibold">{formatIqd(toIqd(v, cur, rate), locale)}</span><span className="block text-xs text-charcoal-600">{formatUsd(toUsd(v, cur, rate), locale)}</span></span>
  );

  return (
    <>
      <PageHero eyebrow={t.nav.prices} title={t.prices.title} text={t.prices.intro} />
      <div className="container-x mt-10 space-y-4">
        <Notice tone="warn"><strong>{t.prices.notOfficial}</strong> {fmt(t.common.rateNote, { rate })}</Notice>
        {prices.some((p) => p.isDemo) && <Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice>}
        <FilterBar base={`/${locale}/prices`} param="category" current={category} allLabel={t.common.all} options={PRICE_CATEGORIES.map((c) => ({ value: c, label: t.priceCats[c] }))} />
      </div>
      <section className="container-x mt-8">
        {list.length === 0 ? <Notice>{t.common.priceNotVerified}</Notice> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">{t.prices.title}</caption>
              <thead className="bg-sand-100 text-start text-xs uppercase tracking-wide text-charcoal-600">
                <tr>
                  {[t.common.category, t.common.destination, t.common.min, t.common.avg, t.common.max, t.common.unit, t.common.city, t.common.provider, t.common.source, t.common.lastUpdated, t.common.status].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {list.map((p) => {
                  const stale = isStale(p.lastUpdated);
                  const src = p.sourceId ? sources.get(p.sourceId) : null;
                  return (
                    <tr key={p.id} className="align-top">
                      <td className="px-4 py-3 text-xs font-semibold uppercase text-gold-700">{t.priceCats[p.category]}</td>
                      <td className="px-4 py-3"><span className="font-medium">{p.item}</span> {p.isDemo && <DemoBadge t={t} />}</td>
                      <td className="px-4 py-3">{both(p.min, p.currency)}</td>
                      <td className="px-4 py-3">{both(p.avg, p.currency)}</td>
                      <td className="px-4 py-3">{both(p.max, p.currency)}</td>
                      <td className="px-4 py-3">{p.unit} <span className="block text-xs text-charcoal-600">{p.currency}</span></td>
                      <td className="px-4 py-3">{p.city ?? (p.governorateId ? tr(govById.get(p.governorateId)?.name, locale) : t.common.all)}</td>
                      <td className="px-4 py-3">{p.provider ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{src ? <a className="underline" href={src.url} target="_blank" rel="noopener noreferrer">{src.name}</a> : p.sourceNote ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{formatDate(p.lastUpdated, locale)}{stale && <span className="mt-1 block font-semibold text-rose-700">⚠ {t.prices.staleWarn}</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={stale && p.verificationStatus === "verified" ? "outdated" : p.verificationStatus} t={t} />
                        {p.verificationStatus !== "verified" && <span className="mt-1 block text-xs font-semibold text-amber-800">⚠ {t.prices.unverifiedWarn}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
