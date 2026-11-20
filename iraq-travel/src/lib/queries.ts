import "server-only";
import type { EntityMap, EntityName, Governorate, TouristSite } from "@/data/types";
import { repo } from "@/lib/store";
import { showDemoData } from "@/lib/env";
import { isAdvisoryActive } from "@/lib/access";
import { manifestPhotos } from "@/lib/photos";

/** Public reads: only published records; demo records only when enabled. */
export async function listPublic<K extends EntityName>(entity: K): Promise<EntityMap[K][]> {
  const all = await repo().list(entity);
  const demo = showDemoData();
  return all.filter((r) => r.published && (demo || !r.isDemo));
}

export async function getGovernorates(): Promise<Governorate[]> {
  return (await listPublic("governorates")).sort((a, b) => a.name.en.localeCompare(b.name.en));
}

export async function getGovernorateBySlug(slug: string) {
  return (await getGovernorates()).find((g) => g.slug === slug) ?? null;
}

export async function getSites(): Promise<TouristSite[]> {
  // Editor-attached photos (CMS) take precedence; otherwise use verified photos from image-manifest.json.
  return (await listPublic("touristSites")).map((s) => (s.images.some((i) => i.verified) ? s : { ...s, images: manifestPhotos(s.slug) }));
}

export async function getSiteBySlug(slug: string) {
  return (await getSites()).find((s) => s.slug === slug) ?? null;
}

export async function getActiveAdvisories() {
  return (await listPublic("safetyAdvisories")).filter((a) => isAdvisoryActive(a)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getSourcesById() {
  const list = await listPublic("officialSources");
  return new Map(list.map((s) => [s.id, s]));
}
