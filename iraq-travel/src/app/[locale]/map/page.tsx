import type { Metadata } from "next";
import { PageHero } from "@/components/cards";
import { MapExplorer, type ExplorerPoint } from "@/components/map/map-explorer";
import { getGovernorates, getSites, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";
import { transportHubs } from "@/data/transport";
import { uid } from "@/data/ids";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/map", t.map.title, t.map.intro);
}

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [governorates, sites, hotels, restaurants] = await Promise.all([getGovernorates(), getSites(), listPublic("hotels"), listPublic("restaurants")]);
  const gov = new Map(governorates.map((g) => [g.id, tr(g.name, locale)]));
  const points: ExplorerPoint[] = [
    ...sites.map((s) => ({
      id: s.id, layer: (s.categories.includes("natural") || s.categories.includes("park") ? "natural" : "site") as ExplorerPoint["layer"], name: tr(s.name, locale),
      subtitle: gov.get(s.governorateId) ?? "", lat: s.lat, lng: s.lng, href: `/${locale}/destinations/${s.slug}`, approximate: s.coordinatesApproximate, demo: false,
    })),
    ...hotels.filter((h) => h.lat != null && h.lng != null).map((h) => ({ id: h.id, layer: "hotel" as const, name: h.name, subtitle: h.city, lat: h.lat!, lng: h.lng!, href: `/${locale}/hotels/${h.slug}`, approximate: true, demo: !!h.isDemo })),
    ...restaurants.filter((r) => r.lat != null && r.lng != null).map((r) => ({ id: r.id, layer: "restaurant" as const, name: r.name, subtitle: r.city, lat: r.lat!, lng: r.lng!, href: `/${locale}/restaurants/${r.slug}`, approximate: true, demo: !!r.isDemo })),
    ...transportHubs.map((h) => ({ id: h.id, layer: h.kind, name: h.name, subtitle: gov.get(uid(h.governorateId)) ?? "", lat: h.lat, lng: h.lng, href: null, approximate: true, demo: false })),
  ];
  return (
    <>
      <PageHero eyebrow={t.nav.map} title={t.map.title} text={t.map.intro} />
      <MapExplorer points={points} t={t.map} common={t.common} />
    </>
  );
}
