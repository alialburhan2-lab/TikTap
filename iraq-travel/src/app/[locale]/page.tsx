import Link from "next/link";
import type { Metadata } from "next";
import { HeroArt } from "@/components/hero-art";
import { HotelCard, SectionHeading, SiteCard } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Notice } from "@/components/badges";
import { getActiveAdvisories, getGovernorates, getSites, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "", `${t.brand.name} — ${t.brand.tagline}`, t.home.heroText);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [governorates, sites, hotels, advisories] = await Promise.all([getGovernorates(), getSites(), listPublic("hotels"), getActiveAdvisories()]);
  const govById = new Map(governorates.map((g) => [g.id, g]));
  const featured = sites.filter((s) => s.featured).slice(0, 8);
  const unescoListings = [...new Map(sites.filter((s) => s.unesco).map((s) => [s.unesco!.url, s])).values()].sort((a, b) => a.unesco!.year - b.unesco!.year);
  const p = (s: string) => `/${locale}${s}`;

  return (
    <>
      {/* A. Hero */}
      <section className="relative isolate flex min-h-[88vh] items-end overflow-hidden text-white">
        <HeroArt />
        <div className="absolute inset-0 bg-gradient-to-t from-river-950/90 via-river-950/30 to-transparent" aria-hidden />
        <div className="container-x relative pb-40 pt-32 md:pb-48">
          <p className="eyebrow mb-4 animate-rise text-gold-300">{t.brand.tagline}</p>
          <h1 className="font-display animate-rise text-5xl font-bold leading-[1.05] md:text-7xl">{t.home.heroTitle}</h1>
          <p className="mt-5 max-w-2xl animate-rise text-lg text-sand-100 md:text-xl">{t.home.heroText}</p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3">
            <Link href={p("/destinations")} className="btn-gold px-7 py-3 text-base">{t.home.exploreBtn}</Link>
            <Link href={p("/planner")} className="btn-ghost px-7 py-3 text-base">{t.home.planBtn}</Link>
          </div>
          <p className="mt-10 text-xs tracking-[0.25em] text-sand-300">{t.home.heroCaption}</p>
        </div>
      </section>

      {/* B. Search */}
      <section className="container-x relative z-10 -mt-24" aria-label={t.home.searchTitle}>
        <h2 className="sr-only">{t.home.searchTitle}</h2>
        <SearchBox locale={locale} t={t} governorates={governorates} />
        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[[governorates.length, t.home.stats.governorates], [sites.length, t.home.stats.sites], [unescoListings.length, t.home.stats.unesco]].map(([n, l]) => (
            <div key={String(l)} className="rounded-2xl bg-white/70 p-4 ring-1 ring-river-900/5">
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-3xl font-bold text-river-900">{n}</dd>
              <dd className="text-xs text-charcoal-600">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* C. Featured */}
      <section className="container-x mt-20">
        <SectionHeading eyebrow={t.nav.destinations} title={t.home.featuredTitle} text={t.home.featuredText} action={<Link href={p("/destinations")} className="btn-outline">{t.common.viewAll}</Link>} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => <SiteCard key={s.id} site={s} gov={govById.get(s.governorateId)} locale={locale} t={t} />)}
        </div>
      </section>

      {/* D. UNESCO */}
      <section className="mt-24 bg-river-900 py-20 text-white">
        <div className="container-x">
          <p className="eyebrow mb-2 text-gold-300">UNESCO</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t.home.unescoTitle}</h2>
          <p className="mt-3 max-w-2xl text-sand-200">{t.home.unescoText}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unescoListings.map((s) => (
              <li key={s.unesco!.url} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10">
                <p className="font-display text-4xl font-bold text-gold-400">{s.unesco!.year}</p>
                <h3 className="mt-2 font-semibold">{s.unesco!.listing}</h3>
                <p className="mt-1 text-sm text-sand-300">{tr(govById.get(s.governorateId)?.name, locale)}</p>
                <Link href={p(`/destinations/${s.slug}`)} className="mt-4 inline-block text-sm font-semibold text-gold-300 hover:text-gold-400">{t.common.learnMore} →</Link>
              </li>
            ))}
          </ol>
          <Link href={p("/heritage")} className="btn-gold mt-10">{t.nav.heritage}</Link>
        </div>
      </section>

      {/* E. Plan your trip + Fair price */}
      <section className="container-x mt-24 grid gap-6 lg:grid-cols-2">
        <div className="card relative overflow-hidden p-8 md:p-10">
          <p className="eyebrow mb-2">{t.nav.planner}</p>
          <h2 className="font-display text-3xl font-bold text-river-900">{t.home.planTitle}</h2>
          <p className="mt-3 text-charcoal-600">{t.home.planText}</p>
          <Link href={p("/planner")} className="btn-river mt-6">{t.home.planBtn}</Link>
        </div>
        <div className="card relative overflow-hidden bg-gradient-to-br from-gold-500 to-gold-700 p-8 text-white md:p-10">
          <p className="eyebrow mb-2 text-white/80">{t.nav.prices}</p>
          <h2 className="font-display text-3xl font-bold">{t.home.fairPriceTitle}</h2>
          <p className="mt-3 text-white/90">{t.home.fairPriceText}</p>
          <Link href={p("/prices")} className="btn mt-6 bg-white text-gold-700 hover:bg-sand-100">{t.common.viewAll}</Link>
        </div>
      </section>

      {/* F. Travel safely */}
      <section className="container-x mt-24">
        <SectionHeading eyebrow={t.nav.safety} title={t.home.safetyTitle} text={t.home.safetyText} action={<Link href={p("/safety")} className="btn-outline">{t.nav.safety}</Link>} />
        {advisories.length === 0 ? (
          <Notice tone="warn"><strong>{t.common.verifyBefore}</strong> {t.safety.checkOfficial}: <a className="underline" href="https://www.gov.uk/foreign-travel-advice/iraq" target="_blank" rel="noopener noreferrer">UK FCDO</a> · <a className="underline" href="https://travel.state.gov/" target="_blank" rel="noopener noreferrer">U.S. Department of State</a></Notice>
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {advisories.slice(0, 3).map((a) => (
              <li key={a.id} className="card p-5"><p className="text-xs text-charcoal-600">{a.issuer} · {a.publishedAt.slice(0, 10)}</p><p className="mt-1 font-semibold text-river-900">{a.title}</p></li>
            ))}
          </ul>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[[t.nav.protection, "/protection"], [t.nav.emergency, "/emergency"], [t.nav.sources, "/sources"]].map(([l, h]) => (
            <Link key={h} href={p(h)} className="card card-hover p-5 font-semibold text-river-900">{l} →</Link>
          ))}
        </div>
      </section>

      {/* G. Recommended hotels */}
      <section className="container-x mt-24">
        <SectionHeading eyebrow={t.nav.hotels} title={t.home.hotelsTitle} text={t.home.hotelsText} action={<Link href={p("/hotels")} className="btn-outline">{t.common.viewAll}</Link>} />
        {hotels.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{hotels.slice(0, 3).map((h) => <HotelCard key={h.id} hotel={h} locale={locale} t={t} />)}</div>
        ) : <Notice>{t.common.notListedYet}</Notice>}
      </section>

      {/* H + I. Food & Transport */}
      <section className="container-x mt-24 grid gap-6 lg:grid-cols-2">
        <Link href={p("/restaurants")} className="card card-hover group relative overflow-hidden p-8 md:p-10">
          <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-gold-400/15" aria-hidden />
          <p className="eyebrow mb-2">{t.nav.restaurants}</p>
          <h2 className="font-display text-3xl font-bold text-river-900">{t.home.foodTitle}</h2>
          <p className="mt-3 text-charcoal-600">{t.home.foodText}</p>
          <span className="mt-6 inline-block font-semibold text-gold-700 group-hover:underline">{t.common.learnMore} →</span>
        </Link>
        <Link href={p("/transport")} className="card card-hover group relative overflow-hidden p-8 md:p-10">
          <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-river-500/10" aria-hidden />
          <p className="eyebrow mb-2">{t.nav.transport}</p>
          <h2 className="font-display text-3xl font-bold text-river-900">{t.home.transportTitle}</h2>
          <p className="mt-3 text-charcoal-600">{t.home.transportText}</p>
          <span className="mt-6 inline-block font-semibold text-gold-700 group-hover:underline">{t.common.learnMore} →</span>
        </Link>
      </section>
    </>
  );
}
