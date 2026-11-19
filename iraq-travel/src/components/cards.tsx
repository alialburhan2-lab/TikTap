import Link from "next/link";
import type { Governorate, Hotel, Restaurant, TouristSite } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { tr } from "@/lib/localize";
import { formatUsd } from "@/lib/money";
import { DemoBadge, ProviderBadge, StatusBadge } from "./badges";
import { PlaceImage } from "./place-image";

export function SectionHeading({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-bold text-river-900 md:text-4xl">{title}</h2>
        {text && <p className="mt-3 text-charcoal-600">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-river-900 text-white">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(45deg,#e5c57e 0 1px,transparent 1px 14px)" }} aria-hidden />
      <div className="container-x relative py-14 md:py-20">
        {eyebrow && <p className="eyebrow mb-3 text-gold-300">{eyebrow}</p>}
        <h1 className="font-display max-w-3xl animate-rise text-4xl font-bold md:text-5xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg text-sand-200">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function SiteCard({ site, gov, locale, t }: { site: TouristSite; gov?: Governorate; locale: Locale; t: Dictionary }) {
  return (
    <Link href={`/${locale}/destinations/${site.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <PlaceImage images={site.images} category={site.categories[0]} alt={tr(site.name, locale)} t={t} className="aspect-[4/3]" showCaption />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {site.unesco && <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[11px] font-semibold text-gold-700 ring-1 ring-gold-500/30">UNESCO</span>}
          <span className="text-[11px] font-medium uppercase tracking-wide text-charcoal-600">{t.categories[site.categories[0]]}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-river-900 group-hover:text-gold-700">{tr(site.name, locale)}</h3>
        {gov && <p className="text-sm text-charcoal-600">{tr(gov.name, locale)}</p>}
        <p className="mt-2 line-clamp-3 text-sm text-charcoal-600">{tr(site.summary, locale)}</p>
        <div className="mt-auto pt-4"><StatusBadge status={site.verificationStatus} lastVerified={site.lastVerified} t={t} /></div>
      </div>
    </Link>
  );
}

export function GovernorateCard({ gov, count, locale, t }: { gov: Governorate; count: number; locale: Locale; t: Dictionary }) {
  return (
    <Link href={`/${locale}/destinations/${gov.slug}`} className="card card-hover group relative flex min-h-40 flex-col justify-end overflow-hidden">
      <PlaceImage images={gov.images} category="historic_city" alt={tr(gov.name, locale)} t={t} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-river-950/90 via-river-950/40 to-transparent" aria-hidden />
      <div className="relative p-5 text-white">
        <p className="text-[11px] uppercase tracking-widest text-gold-300">{t.common[gov.region]}</p>
        <h3 className="font-display text-2xl font-bold">{tr(gov.name, locale)}</h3>
        <p className="text-sm text-sand-200">{t.common.capital}: {tr(gov.capital, locale)} · {count} {t.destinations.sites.toLowerCase()}</p>
      </div>
    </Link>
  );
}

const yesNo = (v: boolean | null, t: Dictionary) => (v == null ? t.common.unknown : v ? t.common.yes : t.common.no);

export function HotelCard({ hotel, locale, t }: { hotel: Hotel; locale: Locale; t: Dictionary }) {
  return (
    <Link href={`/${locale}/hotels/${hotel.slug}`} className="card card-hover flex flex-col overflow-hidden">
      <PlaceImage images={hotel.images} category="historic_city" alt={hotel.name} t={t} className="aspect-[16/9]" showCaption />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {hotel.isDemo && <DemoBadge t={t} />}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gold-700">{t.hotelCats[hotel.category]}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-river-900">{hotel.name}</h3>
        <p className="text-sm text-charcoal-600">{hotel.city}</p>
        <p className="text-sm">
          {hotel.roomPriceMinUsd != null && hotel.roomPriceMaxUsd != null
            ? <>{formatUsd(hotel.roomPriceMinUsd, locale)}–{formatUsd(hotel.roomPriceMaxUsd, locale)} <span className="text-charcoal-600">{t.common.perNight}</span></>
            : t.common.priceNotVerified}
        </p>
        <p className="text-xs text-charcoal-600">{t.hotels.wifi}: {yesNo(hotel.wifi, t)} · {t.hotels.breakfast}: {yesNo(hotel.breakfast, t)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <ProviderBadge level={hotel.providerLevel} t={t} />
          <StatusBadge status={hotel.verificationStatus} lastVerified={hotel.lastVerified} t={t} />
        </div>
      </div>
    </Link>
  );
}

export function RestaurantCard({ r, locale, t }: { r: Restaurant; locale: Locale; t: Dictionary }) {
  return (
    <Link href={`/${locale}/restaurants/${r.slug}`} className="card card-hover flex flex-col overflow-hidden">
      <PlaceImage images={r.images} category="market" alt={r.name} t={t} className="aspect-[16/9]" showCaption />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {r.isDemo && <DemoBadge t={t} />}
          {r.categories.slice(0, 3).map((c) => <span key={c} className="text-[11px] font-semibold uppercase tracking-wide text-gold-700">{t.restCats[c]}</span>)}
        </div>
        <h3 className="font-display text-lg font-bold text-river-900">{r.name}</h3>
        <p className="text-sm text-charcoal-600">{r.city}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <ProviderBadge level={r.providerLevel} t={t} />
          <StatusBadge status={r.verificationStatus} lastVerified={r.lastVerified} t={t} />
        </div>
      </div>
    </Link>
  );
}
