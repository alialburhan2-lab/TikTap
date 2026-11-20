import type { MetadataRoute } from "next";
import { LOCALES, LOCALE_META } from "@/i18n/config";
import { siteUrl } from "@/lib/env";
import { getGovernorates, getSites } from "@/lib/queries";

export const revalidate = 3600;

const STATIC = ["", "/destinations", "/heritage", "/planner", "/hotels", "/restaurants", "/prices", "/transport", "/map", "/safety", "/protection", "/emergency", "/sources", "/heritage/babylon-civilization"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [govs, sites] = await Promise.all([getGovernorates(), getSites()]);
  const paths = [
    ...STATIC.map((p) => ({ p, lastModified: undefined as string | undefined })),
    ...govs.map((g) => ({ p: `/destinations/${g.slug}`, lastModified: g.updatedAt })),
    ...sites.map((s) => ({ p: `/destinations/${s.slug}`, lastModified: s.updatedAt })),
  ];
  return paths.flatMap(({ p, lastModified }) =>
    LOCALES.map((l) => ({
      url: `${base}/${l}${p}`,
      lastModified,
      changeFrequency: p === "/safety" ? ("daily" as const) : ("weekly" as const),
      priority: p === "" ? 1 : p.startsWith("/destinations/") ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [LOCALE_META[x].htmlLang, `${base}/${x}${p}`])) },
    })),
  );
}
