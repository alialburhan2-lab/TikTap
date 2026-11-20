/**
 * Builds src/data/image-manifest.json and src/data/missing-images.json from the photo folders.
 *
 *   public/images/iraq/<folder>/<folder>-hero.jpg            (16:9 hero)
 *   public/images/iraq/<folder>/<folder>-gallery-01.jpg …    (gallery)
 *   public/images/iraq/<folder>/<folder>-thumbnail.jpg       (4:3 or 1:1)
 *   public/images/iraq/<folder>/credits.json                 (REQUIRED for every folder with photos)
 *
 * credits.json:
 *   { "photographer": "...", "license": "CC BY-SA 4.0", "source_url": "https://...",
 *     "attribution": "Photo: X, CC BY-SA 4.0, via Wikimedia Commons",
 *     "alt_en": "...", "alt_ar": "...",
 *     "verified_by": "editor name", "verified_at": "2026-11-20",        // only after a human checked the
 *     "verification_status": "verified" }                               // place AND the licence
 *
 * The script never marks anything "verified" by itself:
 *   - no photo files                          -> "placeholder"
 *   - photos but missing licence/photographer -> "placeholder" (listed as missing licence)
 *   - photos + licence + photographer         -> "source_checked"
 *   - credits.json says verified + verified_by -> "verified"  (shown on the public site)
 * Usage: npm run photos:import
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PHOTO_CATALOG, type CatalogEntry } from "../src/data/photo-catalog";
import { EXTRA_PHOTO_ENTRIES } from "../src/data/photo-extra";

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "images", "iraq");
const FREE_OR_GRANTED = /^(cc[- ]?by|cc0|public domain|pd|permission granted|owned by iraq travel|own work)/i;

type Credits = Partial<Record<"photographer" | "license" | "source_url" | "attribution" | "alt_en" | "alt_ar" | "verified_by" | "verified_at" | "verification_status", string>>;

const manifest: unknown[] = [];
const missing: unknown[] = [];

for (const e of [...PHOTO_CATALOG, ...EXTRA_PHOTO_ENTRIES] as CatalogEntry[]) {
  const dir = path.join(IMG_DIR, e.folder);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
  const credits: Credits = existsSync(path.join(dir, "credits.json")) ? JSON.parse(readFileSync(path.join(dir, "credits.json"), "utf8")) : {};
  const url = (f: string) => `/images/iraq/${e.folder}/${f}`;
  const hero = files.find((f) => f.startsWith(`${e.folder}-hero.`)) ?? null;
  const gallery = files.filter((f) => f.startsWith(`${e.folder}-gallery-`));
  const thumbnail = files.find((f) => f.startsWith(`${e.folder}-thumbnail.`)) ?? null;
  const hasLicence = !!(credits.license && credits.photographer && FREE_OR_GRANTED.test(credits.license));

  let status: "verified" | "source_checked" | "placeholder" = "placeholder";
  if (hero && hasLicence) status = credits.verification_status === "verified" && credits.verified_by ? "verified" : "source_checked";

  manifest.push({
    site_id: e.siteSlug,
    also_site_ids: e.alsoSiteSlugs ?? [],
    folder: e.folder,
    name_en: e.nameEn,
    name_ar: e.nameAr,
    governorate: e.governorate,
    hero: hero ? url(hero) : null,
    gallery: gallery.map(url),
    thumbnail: thumbnail ? url(thumbnail) : null,
    alt_en: credits.alt_en ?? `${e.nameEn}, ${e.governorate}, Iraq — photograph of the site.`,
    alt_ar: credits.alt_ar ?? `${e.nameAr}، العراق — صورة للموقع.`,
    source_url: credits.source_url ?? null,
    reference_gallery: e.referenceUrl,
    photographer: credits.photographer ?? null,
    license: credits.license ?? null,
    attribution: credits.attribution ?? null,
    verification_status: status,
    verified_by: status === "verified" ? credits.verified_by : null,
    verified_at: status === "verified" ? credits.verified_at ?? null : null,
    guidance: e.guidance,
  });

  if (status !== "verified") {
    missing.push({
      site_id: e.siteSlug, folder: e.folder, name_en: e.nameEn, name_ar: e.nameAr,
      reason: !hero ? "no photo files" : !hasLicence ? "photo present but licence/photographer missing or not free" : "awaiting human verification (place + licence)",
      reference_gallery: e.referenceUrl, source_note: e.sourceNote, guidance: e.guidance,
    });
  }
}

writeFileSync(path.join(ROOT, "src", "data", "image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(path.join(ROOT, "src", "data", "missing-images.json"), JSON.stringify(missing, null, 2) + "\n");
const verified = manifest.filter((m) => (m as { verification_status: string }).verification_status === "verified").length;
console.log(`Catalog entries: ${manifest.length} · verified: ${verified} · missing/pending: ${missing.length}`);
