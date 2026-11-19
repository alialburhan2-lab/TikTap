import Link from "next/link";
import type { Metadata } from "next";
import { GovernorateCard, PageHero, SectionHeading, SiteCard } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Notice } from "@/components/badges";
import { getGovernorates, getSites } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";
import { SITE_CATEGORIES, type SiteCategory } from "@/data/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/destinations", t.destinations.title, t.destinations.intro);
}

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function DestinationsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Search }) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const q = one(sp.q)?.toLowerCase().trim();
  const gov = one(sp.gov);
  const category = one(sp.category) as SiteCategory | undefined;
  const budget = one(sp.budget);
  const days = one(sp.days);
  const [governorates, sites] = await Promise.all([getGovernorates(), getSites()]);
  const govById = new Map(governorates.map((g) => [g.id, g]));
  const govBySlug = new Map(governorates.map((g) => [g.slug, g]));
  const filtering = !!(q || gov || category);

  const results = sites.filter((s) => {
    if (gov && govById.get(s.governorateId)?.slug !== gov) return false;
    if (category && SITE_CATEGORIES.includes(category) && !s.categories.includes(category)) return false;
    if (q) {
      const g = govById.get(s.governorateId);
      const hay = [...Object.values(s.name), ...Object.values(s.summary), ...(g ? Object.values(g.name) : [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const matchingGovs = q ? governorates.filter((g) => Object.values(g.name).join(" ").toLowerCase().includes(q)) : [];
  const plannerQs = new URLSearchParams();
  if (budget) plannerQs.set("budget", budget);
  if (days) plannerQs.set("days", days);
  if (gov) plannerQs.set("arrival", gov);

  return (
    <>
      <PageHero eyebrow={t.nav.destinations} title={t.destinations.title} text={t.destinations.intro} />
      <div className="container-x -mt-8 relative z-10">
        <SearchBox locale={locale} t={t} governorates={governorates} defaults={{ q: one(sp.q), gov, category, budget, days }} />
      </div>

      {(budget || days) && (
        <div className="container-x mt-6">
          <Notice>
            {t.home.planText}{" "}
            <Link className="font-semibold underline" href={`/${locale}/planner?${plannerQs.toString()}`}>{t.home.planBtn} →</Link>
          </Notice>
        </div>
      )}

      {filtering ? (
        <section className="container-x mt-12">
          <SectionHeading title={`${results.length} ${t.common.results}`} action={<Link href={`/${locale}/destinations`} className="btn-outline">{t.common.all}</Link>} />
          {matchingGovs.length > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchingGovs.map((g) => <GovernorateCard key={g.id} gov={g} count={sites.filter((s) => s.governorateId === g.id).length} locale={locale} t={t} />)}
            </div>
          )}
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{results.map((s) => <SiteCard key={s.id} site={s} gov={govById.get(s.governorateId)} locale={locale} t={t} />)}</div>
          ) : <Notice>{t.common.noResults}</Notice>}
        </section>
      ) : (
        <>
          <section className="container-x mt-14">
            <SectionHeading title={t.destinations.governorates} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {governorates.map((g) => <GovernorateCard key={g.id} gov={g} count={sites.filter((s) => s.governorateId === g.id).length} locale={locale} t={t} />)}
            </div>
          </section>
          <section className="container-x mt-16">
            <SectionHeading title={t.destinations.sites} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...sites].sort((a, b) => tr(a.name, locale).localeCompare(tr(b.name, locale))).map((s) => <SiteCard key={s.id} site={s} gov={govById.get(s.governorateId)} locale={locale} t={t} />)}
            </div>
          </section>
        </>
      )}
      {gov && !govBySlug.has(gov) && <div className="container-x mt-6"><Notice tone="warn">{t.common.noResults}</Notice></div>}
    </>
  );
}
