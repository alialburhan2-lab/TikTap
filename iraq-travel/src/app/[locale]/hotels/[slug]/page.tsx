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
import { formatUsd } from "@/lib/money";

type P = Promise<{ locale: string; slug: string }>;

async function find(slug: string) {
  return (await listPublic("hotels")).find((h) => h.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  const h = await find((await params).slug);
  if (!h) return {};
  return pageMetadata(locale, `/hotels/${h.slug}`, h.name, `${t.hotelCats[h.category]} · ${h.city}`, { noindex: !!h.isDemo });
}

export default async function HotelPage({ params }: { params: P }) {
  const { locale, t } = await resolveLocale(params);
  const hotel = await find((await params).slug);
  if (!hotel) notFound();
  const [governorates, reviews] = await Promise.all([getGovernorates(), listPublic("reviews")]);
  const gov = governorates.find((g) => g.id === hotel.governorateId);
  const yn = (v: boolean | null) => (v == null ? null : v ? t.common.yes : t.common.no);
  const approved = reviews.filter((r) => r.targetType === "hotel" && r.targetId === hotel.id && r.status === "approved");

  return (
    <div className="container-x py-10">
      <Link href={`/${locale}/hotels`} className="text-sm text-charcoal-600 hover:underline">← {t.hotels.title}</Link>
      {hotel.isDemo && <div className="mt-4"><Notice tone="demo"><strong>{t.common.demo}:</strong> {t.common.demoNotice}</Notice></div>}
      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceImage images={hotel.images} category="historic_city" alt={hotel.name} t={t} className="aspect-[16/9] rounded-2xl" showCaption />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {hotel.isDemo && <DemoBadge t={t} />}
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-700">{t.hotelCats[hotel.category]}</span>
            <ProviderBadge level={hotel.providerLevel} t={t} />
            <StatusBadge status={hotel.verificationStatus} lastVerified={hotel.lastVerified} t={t} />
          </div>
          <h1 className="font-display mt-3 text-4xl font-bold text-river-900">{hotel.name}</h1>
          <p className="text-charcoal-600">{hotel.city}{gov ? ` · ${tr(gov.name, locale)}` : ""}</p>

          <h2 className="font-display mt-10 text-2xl font-bold text-river-900">{t.hotels.facilities}</h2>
          <dl className="card mt-4 px-5 py-2">
            <InfoRow label={t.hotels.roomPrices} value={hotel.roomPriceMinUsd != null && hotel.roomPriceMaxUsd != null ? `${formatUsd(hotel.roomPriceMinUsd, locale)} – ${formatUsd(hotel.roomPriceMaxUsd, locale)} ${t.common.perNight}${hotel.isDemo ? ` (${t.common.demo})` : ""}` : null} missing={t.common.priceNotVerified} />
            <InfoRow label={t.hotels.breakfast} value={yn(hotel.breakfast)} missing={t.common.unknown} />
            <InfoRow label={t.hotels.wifi} value={yn(hotel.wifi)} missing={t.common.unknown} />
            <InfoRow label={t.hotels.ac} value={yn(hotel.airConditioning)} missing={t.common.unknown} />
            <InfoRow label={t.hotels.parking} value={yn(hotel.parking)} missing={t.common.unknown} />
            <InfoRow label={t.hotels.facilities} value={hotel.facilities.length ? hotel.facilities.join(", ") : null} missing={t.common.unknown} />
            <InfoRow label={t.hotels.cancellation} value={hotel.cancellationPolicy} missing={t.common.unknown} />
          </dl>

          <h2 className="font-display mt-10 text-2xl font-bold text-river-900">{t.common.reviews}</h2>
          <p className="mt-1 text-sm text-charcoal-600">{t.common.reviewsDisclaimer}</p>
          <ReviewList reviews={approved} t={t} />
          <ReviewForm targetType="hotel" targetId={hotel.id} locale={locale} />
        </div>
        <aside className="space-y-6">
          <dl className="card px-5 py-2">
            <InfoRow label={t.common.address} value={hotel.address} missing={t.common.unknown} />
            <InfoRow label={t.common.phone} value={hotel.phone ? <a href={`tel:${hotel.phone}`} className="underline">{hotel.phone}</a> : null} missing={t.common.unknown} />
            <InfoRow label={t.common.whatsapp} value={hotel.whatsapp ? <a href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}`} className="underline" rel="noopener noreferrer" target="_blank">{hotel.whatsapp}</a> : null} missing={t.common.unknown} />
            <InfoRow label={t.hotels.booking} value={hotel.bookingContact} missing={t.common.unknown} />
            <InfoRow label={t.common.lastVerified} value={formatDate(hotel.lastVerified, locale)} missing={t.common.never} />
          </dl>
          <Notice>{t.common.bookingNotAvailable}</Notice>
          {hotel.lat != null && hotel.lng != null && <div className="card p-4"><MiniMap markers={[{ id: hotel.id, lat: hotel.lat, lng: hotel.lng, title: hotel.name, color: "#2f6aa8" }]} height={240} /></div>}
          <Link href={`/${locale}/protection#report`} className="btn-outline w-full">{t.protection.reportTitle}</Link>
        </aside>
      </div>
    </div>
  );
}
