import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Governorate, TouristSite } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { HotelCard, RestaurantCard, SectionHeading, SiteCard } from "@/components/cards";
import { DemoBadge, Notice, StatusBadge } from "@/components/badges";
import { PlaceImage } from "@/components/place-image";
import { AdvisoryList, InfoRow, SourcesList } from "@/components/info";
import { MiniMap } from "@/components/map/mini-map";
import { getActiveAdvisories, getGovernorates, getSites, getSourcesById, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { formatDate, isTranslated, tr } from "@/lib/localize";
import { haversineKm } from "@/lib/geo";
import { dualPrice } from "@/lib/money";
import { iqdPerUsd, siteUrl } from "@/lib/env";

export const revalidate = 300;
type P = Promise<{ locale: string; slug: string }>;

async function resolve(slug: string) {
  const [governorates, sites] = await Promise.all([getGovernorates(), getSites()]);
  const gov = governorates.find((g) => g.slug === slug);
  const site = gov ? undefined : sites.find((s) => s.slug === slug);
  return { governorates, sites, gov, site };
}

export async function generateStaticParams() {
  const [governorates, sites] = await Promise.all([getGovernorates(), getSites()]);
  return [...governorates, ...sites].map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  const { gov, site } = await resolve(slug);
  const item = gov ?? site;
  if (!item) return {};
  return pageMetadata(locale, `/destinations/${slug}`, tr(item.name, locale), tr(item.summary, locale));
}

export default async function DestinationPage({ params }: { params: P }) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const { governorates, sites, gov, site } = await resolve(slug);
  if (gov) return <GovernorateView gov={gov} sites={sites} locale={locale} t={t} />;
  if (site) return <SiteView site={site} sites={sites} governorates={governorates} locale={locale} t={t} />;
  notFound();
}

function Translated({ text, locale, t }: { text: Governorate["summary"]; locale: Locale; t: Dictionary }) {
  return (
    <>
      <p className="leading-relaxed text-charcoal-600">{tr(text, locale)}</p>
      {!isTranslated(text, locale) && <p className="mt-1 text-xs italic text-charcoal-600">{t.common.translationPending}</p>}
    </>
  );
}

function Hero({ title, subtitle, images, category, badges, t }: { title: string; subtitle: string; images: TouristSite["images"]; category: string; badges: React.ReactNode; t: Dictionary }) {
  return (
    <section className="relative isolate overflow-hidden text-white">
      <PlaceImage images={images} category={category} alt={title} t={t} className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-river-950/95 via-river-950/50 to-river-950/20" aria-hidden />
      <div className="container-x py-20 md:py-28">
        <div className="mb-3 flex flex-wrap gap-2">{badges}</div>
        <h1 className="font-display max-w-4xl animate-rise text-4xl font-bold md:text-6xl">{title}</h1>
        <p className="mt-3 text-lg text-sand-200">{subtitle}</p>
        {!images.some((i) => i.verified) && <p className="mt-6 text-xs text-sand-300">{t.common.photoPending} — {t.common.photoPendingText}</p>}
      </div>
    </section>
  );
}

async function GovernorateView({ gov, sites, locale, t }: { gov: Governorate; sites: TouristSite[]; locale: Locale; t: Dictionary }) {
  const [hotels, restaurants, routes, prices, advisories, sources, providers] = await Promise.all([
    listPublic("hotels"), listPublic("restaurants"), listPublic("transportRoutes"), listPublic("priceRecords"), getActiveAdvisories(), getSourcesById(), listPublic("transportProviders"),
  ]);
  const mine = sites.filter((s) => s.governorateId === gov.id);
  const groups: [string, TouristSite[]][] = [
    [t.destinations.archaeological, mine.filter((s) => s.categories.includes("archaeological"))],
    [t.destinations.natural, mine.filter((s) => s.categories.includes("natural") && !s.categories.includes("archaeological"))],
    [t.destinations.religious, mine.filter((s) => s.categories.includes("religious") && !s.categories.includes("archaeological"))],
    [t.destinations.other, mine.filter((s) => !s.categories.some((c) => ["archaeological", "natural", "religious"].includes(c)))],
  ];
  const activities = mine.filter((s) => s.interests.includes("entertainment") || s.categories.includes("park") || s.categories.includes("natural"));
  const govHotels = hotels.filter((h) => h.governorateId === gov.id);
  const govRest = restaurants.filter((r) => r.governorateId === gov.id);
  const govRoutes = routes.filter((r) => r.fromGovernorateId === gov.id || r.toGovernorateId === gov.id);
  const govPrices = prices.filter((p) => p.governorateId === gov.id || !p.governorateId).slice(0, 8);
  const govAdvisories = advisories.filter((a) => a.governorateIds.includes(gov.id));
  const rate = iqdPerUsd();
  const providerName = new Map(providers.map((p) => [p.id, p.name]));

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AdministrativeArea", name: gov.name.en, alternateName: Object.values(gov.name), description: gov.summary.en, url: `${siteUrl()}/${locale}/destinations/${gov.slug}`, geo: { "@type": "GeoCoordinates", latitude: gov.lat, longitude: gov.lng }, containedInPlace: { "@type": "Country", name: "Iraq" } }} />
      <Hero title={tr(gov.name, locale)} subtitle={`${t.common.capital}: ${tr(gov.capital, locale)} · ${t.common[gov.region]}`} images={gov.images} category="historic_city" t={t}
        badges={<StatusBadge status={gov.verificationStatus} lastVerified={gov.lastVerified} t={t} />} />
      <div className="container-x mt-12 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section><h2 className="font-display mb-3 text-2xl font-bold text-river-900">{t.common.about}</h2><Translated text={gov.summary} locale={locale} t={t} /></section>
          <section><h2 className="font-display mb-3 text-2xl font-bold text-river-900">{t.common.history}</h2><Translated text={gov.history} locale={locale} t={t} /></section>
          {gov.slug === "babylon" && <Link href={`/${locale}/heritage/babylon-civilization`} className="btn-gold">{t.stories.babylonLink} →</Link>}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="card p-6"><h2 className="font-display mb-2 text-xl font-bold text-river-900">{t.common.geography}</h2><Translated text={gov.geography} locale={locale} t={t} /></div>
            <div className="card p-6"><h2 className="font-display mb-2 text-xl font-bold text-river-900">{t.common.bestTime}</h2><Translated text={gov.bestTimeToVisit} locale={locale} t={t} /></div>
          </section>
        </div>
        <aside className="space-y-6">
          <div className="card p-4"><h2 className="mb-3 font-semibold text-river-900">{t.common.onMap}</h2>
            <MiniMap markers={[{ id: gov.id, lat: gov.lat, lng: gov.lng, title: tr(gov.name, locale), color: "#b8892b" }, ...mine.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, title: tr(s.name, locale), html: `<strong>${tr(s.name, locale)}</strong>` }))]} />
            <p className="mt-2 text-xs text-charcoal-600">{t.common.approxCoords}</p>
          </div>
          <div className="card p-5"><h2 className="mb-3 font-semibold text-river-900">{t.destinations.safety}</h2><AdvisoryList advisories={govAdvisories} locale={locale} t={t} />
            <Link href={`/${locale}/safety`} className="mt-3 inline-block text-sm font-semibold text-gold-700">{t.nav.safety} →</Link></div>
          <div className="card p-5"><h2 className="mb-2 font-semibold text-river-900">{t.common.sources}</h2><SourcesList ids={gov.sourceIds} sources={sources} t={t} /></div>
        </aside>
      </div>

      {groups.filter(([, list]) => list.length).map(([title, list]) => (
        <section key={title} className="container-x mt-16">
          <SectionHeading title={title} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{list.map((s) => <SiteCard key={s.id} site={s} locale={locale} t={t} />)}</div>
        </section>
      ))}
      {mine.length === 0 && <div className="container-x mt-12"><Notice>{t.common.notListedYet}</Notice></div>}

      {activities.length > 0 && (
        <section className="container-x mt-16">
          <SectionHeading title={t.destinations.activities} />
          <ul className="flex flex-wrap gap-2">{activities.map((s) => <li key={s.id}><Link href={`/${locale}/destinations/${s.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-river-900 ring-1 ring-river-900/10 hover:bg-sand-100">{tr(s.name, locale)}</Link></li>)}</ul>
        </section>
      )}

      <section className="container-x mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading title={t.destinations.hotels} action={<Link href={`/${locale}/hotels?gov=${gov.slug}`} className="btn-outline">{t.common.viewAll}</Link>} />
          {govHotels.length ? <div className="grid gap-4 sm:grid-cols-2">{govHotels.slice(0, 4).map((h) => <HotelCard key={h.id} hotel={h} locale={locale} t={t} />)}</div> : <Notice>{t.common.notListedYet}</Notice>}
        </div>
        <div>
          <SectionHeading title={t.destinations.restaurants} action={<Link href={`/${locale}/restaurants?gov=${gov.slug}`} className="btn-outline">{t.common.viewAll}</Link>} />
          {govRest.length ? <div className="grid gap-4 sm:grid-cols-2">{govRest.slice(0, 4).map((r) => <RestaurantCard key={r.id} r={r} locale={locale} t={t} />)}</div> : <Notice>{t.common.notListedYet}</Notice>}
        </div>
      </section>

      <section className="container-x mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading title={t.destinations.transport} />
          {govRoutes.length ? (
            <ul className="card divide-y divide-sand-200">
              {govRoutes.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <span className="font-medium text-river-900">{t.modes[r.mode]}{r.providerId && providerName.get(r.providerId) ? ` · ${providerName.get(r.providerId)}` : ""}</span>
                  <span className="flex items-center gap-2">{r.isDemo && <DemoBadge t={t} />}<StatusBadge status={r.verificationStatus} lastVerified={r.lastVerified} t={t} /></span>
                </li>
              ))}
            </ul>
          ) : <Notice>{t.common.notListedYet}</Notice>}
          <Link href={`/${locale}/transport`} className="mt-3 inline-block text-sm font-semibold text-gold-700">{t.nav.transport} →</Link>
        </div>
        <div>
          <SectionHeading title={t.destinations.costs} />
          {govPrices.length ? (
            <ul className="card divide-y divide-sand-200">
              {govPrices.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <span>{p.item} <span className="text-charcoal-600">({p.unit})</span></span>
                  <span className="flex items-center gap-2 font-semibold">{dualPrice(p.avg, p.currency, rate, locale)} {p.isDemo && <DemoBadge t={t} />}</span>
                </li>
              ))}
            </ul>
          ) : <Notice>{t.common.priceNotVerified}</Notice>}
          <Link href={`/${locale}/prices`} className="mt-3 inline-block text-sm font-semibold text-gold-700">{t.nav.prices} →</Link>
        </div>
      </section>
    </>
  );
}

async function SiteView({ site, sites, governorates, locale, t }: { site: TouristSite; sites: TouristSite[]; governorates: Governorate[]; locale: Locale; t: Dictionary }) {
  const [advisories, sources] = await Promise.all([getActiveAdvisories(), getSourcesById()]);
  const gov = governorates.find((g) => g.id === site.governorateId);
  const nearby = sites.filter((s) => s.id !== site.id).map((s) => ({ s, d: haversineKm(site, s) })).sort((a, b) => a.d - b.d).slice(0, 4);
  const relevant = advisories.filter((a) => a.siteIds.includes(site.id) || a.governorateIds.includes(site.governorateId));
  const name = tr(site.name, locale);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": site.categories.includes("museum") ? "Museum" : "TouristAttraction", name: site.name.en, alternateName: Object.values(site.name),
        description: site.summary.en, url: `${siteUrl()}/${locale}/destinations/${site.slug}`, geo: { "@type": "GeoCoordinates", latitude: site.lat, longitude: site.lng },
        containedInPlace: gov ? { "@type": "AdministrativeArea", name: gov.name.en } : undefined, isAccessibleForFree: undefined,
      }} />
      <Hero title={name} subtitle={`${gov ? tr(gov.name, locale) : ""} · ${site.categories.map((c) => t.categories[c]).join(" · ")}`} images={site.images} category={site.categories[0]} t={t}
        badges={<>{site.unesco && <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold">UNESCO {site.unesco.year}</span>}<StatusBadge status={site.verificationStatus} lastVerified={site.lastVerified} t={t} /></>} />
      <nav aria-label="Breadcrumb" className="container-x mt-6 text-sm text-charcoal-600">
        <Link href={`/${locale}/destinations`} className="hover:underline">{t.nav.destinations}</Link>
        {gov && <> / <Link href={`/${locale}/destinations/${gov.slug}`} className="hover:underline">{tr(gov.name, locale)}</Link></>} / <span className="text-charcoal">{name}</span>
      </nav>
      <div className="container-x mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section><h2 className="font-display mb-3 text-2xl font-bold text-river-900">{t.common.about}</h2><Translated text={site.summary} locale={locale} t={t} /></section>
          <section><h2 className="font-display mb-3 text-2xl font-bold text-river-900">{t.common.history}</h2><Translated text={site.history} locale={locale} t={t} /></section>
          {site.images.filter((i) => i.verified).length > 1 && (
            <section aria-label="Gallery" className="grid gap-3 sm:grid-cols-2">
              {site.images.filter((i) => i.verified).slice(1, 7).map((img) => (
                <figure key={img.url} className="overflow-hidden rounded-2xl bg-sand-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="px-3 py-1.5 text-[11px] text-charcoal-600">{img.credit} · {img.license}{img.sourceUrl && <> · <a className="underline" href={img.sourceUrl} target="_blank" rel="noopener noreferrer">{t.common.source}</a></>}</figcaption>
                </figure>
              ))}
            </section>
          )}
          {site.unesco && (
            <section className="card border-s-4 border-gold-500 p-6">
              <p className="eyebrow">{t.common.unescoListed}</p>
              <p className="mt-1 font-semibold text-river-900">{site.unesco.listing}</p>
              <p className="text-sm text-charcoal-600">{t.common.inscribed}: {site.unesco.year} · <a href={site.unesco.url} className="underline" target="_blank" rel="noopener noreferrer">whc.unesco.org</a></p>
            </section>
          )}
          <section>
            <h2 className="font-display mb-3 text-2xl font-bold text-river-900">{t.destinations.safety}</h2>
            <AdvisoryList advisories={relevant} locale={locale} t={t} />
          </section>
        </div>
        <aside className="space-y-6">
          <dl className="card px-5 py-2">
            <InfoRow label={t.common.openingHours} value={site.openingHours} missing={t.common.hoursNotConfirmed} />
            <InfoRow label={t.common.entranceFee} value={site.entranceFee} missing={t.common.priceNotVerified} />
            <InfoRow label={t.common.accessStatus} value={site.accessStatus === "unknown" ? null : site.accessStatus} missing={t.common.accessUnknown} />
            <InfoRow label={t.common.restrictions} value={site.visitorRestrictions} missing={t.common.unknown} />
            <InfoRow label={t.common.accessibility} value={site.accessibility} missing={t.common.unknown} />
            <InfoRow label={t.common.lastVerified} value={formatDate(site.lastVerified, locale)} missing={t.common.never} />
            <InfoRow label={t.common.status} value={<StatusBadge status={site.verificationStatus} lastVerified={site.lastVerified} t={t} />} />
          </dl>
          {locale !== "en" && site.visitorRestrictions && <p className="text-xs italic text-charcoal-600">{t.common.sensitiveEnglishOnly}</p>}
          <div className="card p-4">
            <MiniMap markers={[{ id: site.id, lat: site.lat, lng: site.lng, title: name, color: "#b8892b" }]} height={260} />
            <p className="mt-2 text-xs text-charcoal-600">{site.lat.toFixed(4)}, {site.lng.toFixed(4)} · {site.coordinatesApproximate ? t.common.approxCoords : ""}</p>
            <a className="mt-1 inline-block text-xs text-river-700 underline" href={`https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lng}#map=14/${site.lat}/${site.lng}`} target="_blank" rel="noopener noreferrer">OpenStreetMap ↗</a>
          </div>
          <div className="card p-5"><h2 className="mb-2 font-semibold text-river-900">{t.common.sources}</h2><SourcesList ids={site.sourceIds} sources={sources} t={t} /></div>
          {gov?.slug === "babylon" && <Link href={`/${locale}/heritage/babylon-civilization`} className="btn-river w-full">{t.stories.babylonLink} →</Link>}
          <Link href={`/${locale}/planner?arrival=${gov?.slug ?? ""}`} className="btn-gold w-full">{t.home.planBtn}</Link>
        </aside>
      </div>
      {nearby.length > 0 && (
        <section className="container-x mt-16">
          <SectionHeading title={t.destinations.nearby} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map(({ s, d }) => (
              <div key={s.id} className="relative">
                <SiteCard site={s} gov={governorates.find((g) => g.id === s.governorateId)} locale={locale} t={t} />
                <span className="absolute end-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-river-900">{d < 1 ? "< 1" : `≈ ${Math.round(d)}`} {t.common.km}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
