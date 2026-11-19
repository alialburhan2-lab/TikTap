import type { Metadata } from "next";
import { PageHero } from "@/components/cards";
import { PlannerClient } from "@/components/planner/planner-client";
import { getActiveAdvisories, getGovernorates, getSites, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/localize";
import { iqdPerUsd } from "@/lib/env";
import type { PlannerData } from "@/lib/planner";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/planner", t.planner.title, t.planner.intro);
}

export default async function PlannerPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const [governorates, sites, advisories, prices, routes] = await Promise.all([getGovernorates(), getSites(), getActiveAdvisories(), listPublic("priceRecords"), listPublic("transportRoutes")]);
  const data: PlannerData = {
    governorates: governorates.map((g) => ({ id: g.id, slug: g.slug, name: tr(g.name, locale), lat: g.lat, lng: g.lng })),
    sites: sites.map((s) => ({
      id: s.id, slug: s.slug, governorateId: s.governorateId, lat: s.lat, lng: s.lng, interests: s.interests, featured: s.featured,
      recommendedVisitHours: s.recommendedVisitHours, accessStatus: s.accessStatus, entranceFee: s.entranceFee, name: tr(s.name, locale),
    })),
    advisories, prices, routes, iqdPerUsd: iqdPerUsd(),
  };
  return (
    <>
      <PageHero eyebrow={t.nav.planner} title={t.planner.title} text={t.planner.intro} />
      <PlannerClient data={data} locale={locale} t={t.planner} common={t.common} interestsLabels={t.interests} hotelCats={t.hotelCats} modes={t.modes}
        initial={{ arrival: sp.arrival, budget: sp.budget, days: sp.days }} />
    </>
  );
}
