import type { CatalogEntry } from "./photo-catalog";

/**
 * Photo entries beyond the 25-entry archaeological catalog: the remaining tourist sites and the
 * governorates (siteSlug "gov:<slug>"). Generated from the Wikimedia Commons lookup; same rules
 * as the catalog (free licence, named photographer, human-reviewed before "verified").
 */
export const EXTRA_PHOTO_ENTRIES: CatalogEntry[] = [];
