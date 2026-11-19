import type { AdvisoryLevel, SafetyAdvisory, TouristSite } from "@/data/types";

const BLOCKING_LEVELS: AdvisoryLevel[] = ["against_all_travel", "against_all_but_essential"];

export function isAdvisoryActive(a: SafetyAdvisory, now = Date.now()): boolean {
  if (!a.published || !a.active) return false;
  if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
  return true;
}

export type AccessDecision =
  | { allowed: true; caution: SafetyAdvisory[] }
  | { allowed: false; reason: "site_closed" | "site_restricted" | "official_advisory"; advisory?: SafetyAdvisory };

/**
 * Decide whether a site may be included in generated itineraries.
 * Excludes a site when it is marked closed/restricted, or when an ACTIVE OFFICIAL advisory
 * advises against (all / all-but-essential) travel to its governorate or to the site itself,
 * or an official site-access advisory (above "info") names the site.
 */
export function siteAccess(site: Pick<TouristSite, "id" | "governorateId" | "accessStatus">, advisories: SafetyAdvisory[], now = Date.now()): AccessDecision {
  if (site.accessStatus === "closed") return { allowed: false, reason: "site_closed" };
  if (site.accessStatus === "restricted") return { allowed: false, reason: "site_restricted" };
  const active = advisories.filter((a) => a.kind === "official" && isAdvisoryActive(a, now));
  for (const a of active) {
    const appliesToGov = a.governorateIds.includes(site.governorateId);
    const appliesToSite = a.siteIds.includes(site.id);
    if ((appliesToGov || appliesToSite) && BLOCKING_LEVELS.includes(a.level)) return { allowed: false, reason: "official_advisory", advisory: a };
    if (appliesToSite && a.category === "site_access" && a.level !== "info") return { allowed: false, reason: "official_advisory", advisory: a };
  }
  const caution = active.filter((a) => a.governorateIds.includes(site.governorateId) || a.siteIds.includes(site.id));
  return { allowed: true, caution };
}
