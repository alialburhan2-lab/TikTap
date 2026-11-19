import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DemoBadge, Notice, ProviderBadge, StatusBadge } from "@/components/badges";
import { PlaceImage } from "@/components/place-image";
import { InfoRow } from "@/components/info";
import { MiniMap } from "@/components/map/mini-map";
import { ReviewForm, ReviewList } from "@/components/reviews";
import { getGovernorates, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { formatDate, tr } from "@/lib/localize";
import { dualPrice } from "@/lib/money";
import { iqdPerUsd } from "@/lib/env";

type P = Promise<{ locale: string; slug: string }>;
const find = async (slug: string) => (await listPublic("restaurants")).find((r) => r.slug === slug) ?? null;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const r = await find((await params).slug);
  if (!r) return {};
  return pageMetadata(locale, `/restaurants/${r.slug}`, r.name, r.city, { noindex: !!r.isDemo });
}

export default async function RestaurantPage({ params }: { params: P }) {
  const { locale, t } = await resolveLocale(params);
  const r = await find((await params).slug);
  if (!r) notFound();
  const [governorates, menus, reviews] = await Promise.all([getGovernorates(), listPublic("restaurantMenus"), listPublic("reviews")]);
  const gov = governorates.find((g) => g.id === r.governorateId);
  const menu = menus.filter((m) => m.restaurantId === r.id);
  const rate = iqdPerUsd();
  const approved = reviews.filter((x) => x.targetType === "restaurant" && x.targetId === r.id && x.status === "approved");

  return (
    <div className="container-x py-10">
      <Link href={`/${locale}/restaurants`} className="text-sm text-charcoal-600 hover:underline">← {t.restaurants.title}</Link>
      {r.isDemo && <div className="mt-4"><Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice></div>}
      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceImage images={r.images} category="market" alt={r.name} t={t} className="aspect-[16/9] rounded-2xl" showCaption />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {r.isDemo && <DemoBadge t={t} />}
            {r.categories.map((c) => <span key={c} className="text-xs font-semibold uppercase tracking-wide text-gold-700">{t.restCats[c]}</span>)}
            <ProviderBadge level={r.providerLevel} t={t} />
            <StatusBadge status={r.verificationStatus} lastVerified={r.lastVerified} t={t} />
          </div>
          <h1 className="font-display mt-3 text-4xl font-bold text-river-900">{r.name}</h1>
          <p className="text-charcoal-600">{r.city}{gov ? ` · ${tr(gov.name, locale)}` : ""}</p>

          <h2 className="font-display mt-10 text-2xl font-bold text-river-900">{t.restaurants.menu}</h2>
          {menu.length ? (
            <ul className="card mt-4 divide-y divide-sand-200">
              {menu.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <span><span className="font-medium">{m.name}</span>{m.description && <span className="block text-xs text-charcoal-600">{m.description}</span>}</span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {m.priceIqd != null ? dualPrice(m.priceIqd, "IQD", rate, locale) : t.common.priceNotVerified}
                    {m.isDemo && <DemoBadge t={t} />}
                    <StatusBadge status={m.verificationStatus} lastVerified={m.lastVerified} t={t} />
                  </span>
                </li>
              ))}
            </ul>
          ) : <div className="mt-4"><Notice>{t.common.priceNotVerified}</Notice></div>}

          <h2 className="font-display mt-10 text-2xl font-bold text-river-900">{t.common.reviews}</h2>
          <p className="mt-1 text-sm text-charcoal-600">{t.common.reviewsDisclaimer}</p>
          <ReviewList reviews={approved} t={t} />
          <ReviewForm targetType="restaurant" targetId={r.id} locale={locale} />
        </div>
        <aside className="space-y-6">
          <dl className="card px-5 py-2">
            <InfoRow label={t.common.address} value={r.address} missing={t.common.unknown} />
            <InfoRow label={t.common.openingHours} value={r.openingHours} missing={t.common.hoursNotConfirmed} />
            <InfoRow label={t.common.contact} value={r.contact} missing={t.common.unknown} />
            <InfoRow label={t.restaurants.dietary} value={r.dietary.length ? r.dietary.join(", ") : null} missing={t.common.unknown} />
            <InfoRow label={t.restaurants.averageCost} value={r.averageCostIqd != null ? `${dualPrice(r.averageCostIqd, "IQD", rate, locale)}${r.isDemo ? ` (${t.common.demo})` : ""}` : null} missing={t.common.priceNotVerified} />
            <InfoRow label={t.common.lastVerified} value={formatDate(r.lastVerified, locale)} missing={t.common.never} />
          </dl>
          {r.lat != null && r.lng != null && <div className="card p-4"><MiniMap markers={[{ id: r.id, lat: r.lat, lng: r.lng, title: r.name, color: "#b8892b" }]} height={240} /></div>}
          <Link href={`/${locale}/protection#report`} className="btn-outline w-full">{t.protection.reportTitle}</Link>
        </aside>
      </div>
    </div>
  );
}
