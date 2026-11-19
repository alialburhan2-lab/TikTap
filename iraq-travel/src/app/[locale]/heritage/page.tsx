import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/cards";
import { Notice } from "@/components/badges";
import { getGovernorates, getSites } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/heritage", t.heritage.title, t.heritage.intro);
}

export default async function HeritagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [sites, governorates] = await Promise.all([getSites(), getGovernorates()]);
  const govById = new Map(governorates.map((g) => [g.id, g]));
  const listings = new Map<string, { listing: string; year: number; url: string; sites: typeof sites }>();
  for (const s of sites) {
    if (!s.unesco) continue;
    const entry = listings.get(s.unesco.url) ?? { ...s.unesco, sites: [] };
    entry.sites.push(s);
    listings.set(s.unesco.url, entry);
  }
  const sorted = [...listings.values()].sort((a, b) => a.year - b.year);

  return (
    <>
      <PageHero eyebrow="UNESCO" title={t.heritage.title} text={t.heritage.intro} />
      <div className="container-x mt-10"><Notice tone="warn">{t.heritage.danger} <a className="underline" href="https://whc.unesco.org/" target="_blank" rel="noopener noreferrer">whc.unesco.org</a></Notice></div>
      <ol className="container-x mt-10 space-y-6">
        {sorted.map((l) => (
          <li key={l.url} className="card grid gap-6 p-6 md:grid-cols-[140px_1fr] md:p-8">
            <div>
              <p className="font-display text-5xl font-bold text-gold-500">{l.year}</p>
              <p className="text-xs uppercase tracking-wider text-charcoal-600">{t.common.inscribed}</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-river-900">{l.listing}</h2>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-river-700 underline">{l.url.replace("https://", "")}</a>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-charcoal-600">{t.heritage.components}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {l.sites.map((s) => (
                  <li key={s.id}>
                    <Link href={`/${locale}/destinations/${s.slug}`} className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-river-900 ring-1 ring-sand-300 hover:bg-sand-200">
                      {tr(s.name, locale)} <span className="text-charcoal-600">· {tr(govById.get(s.governorateId)?.name, locale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
