import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedStore } from "../src/data/seed";
import { uid, isUuid } from "../src/data/ids";
import { siteAccess } from "../src/lib/access";
import { buildPlan, tripLength, type PlannerData, type PlannerInput } from "../src/lib/planner";
import { dualPrice, toIqd } from "../src/lib/money";
import { haversineKm } from "../src/lib/geo";
import { switchLocalePath } from "../src/i18n/config";
import { getDictionary } from "../src/i18n/dictionary";
import { parseEntityForm, parseImages, levelAllowed, maxApprovedLevel } from "../src/lib/admin/form";
import { ENTITIES } from "../src/lib/admin/entities";
import { canManage, canSetProviderLevel, canMarkVerified } from "../src/lib/permissions";
import { isStale } from "../src/lib/localize";
import type { SafetyAdvisory } from "../src/data/types";

const store = buildSeedStore();

function plannerData(advisories: SafetyAdvisory[] = []): PlannerData {
  return {
    governorates: store.governorates.map((g) => ({ id: g.id, slug: g.slug, name: g.name.en, lat: g.lat, lng: g.lng })),
    sites: store.touristSites.map((s) => ({ ...s, name: s.name.en })),
    advisories, prices: store.priceRecords, routes: store.transportRoutes, iqdPerUsd: 1310,
  };
}
const input = (over: Partial<PlannerInput> = {}): PlannerInput => ({
  arrivalGovId: uid("baghdad"), departureGovId: uid("basra"), startDate: "2027-03-01", endDate: "2027-03-07", travelers: 2,
  budget: "mid_range", interests: ["archaeology", "history"], transport: "private_car", hotelCategory: "mid_range", ...over,
});
const advisory = (over: Partial<SafetyAdvisory>): SafetyAdvisory => ({
  id: uid("adv"), createdAt: "", updatedAt: "", published: true, kind: "official", issuer: "Test", title: "t", body: "b",
  level: "against_all_travel", category: "government_advisory", governorateIds: [], siteIds: [], sourceUrl: "https://example.org",
  publishedAt: "2026-11-19T00:00:00Z", expiresAt: null, active: true, verificationStatus: "verified", ...over,
});

test("seed: 18 governorates, all ids are UUIDs and references resolve", () => {
  assert.equal(store.governorates.length, 18);
  const govIds = new Set(store.governorates.map((g) => g.id));
  for (const s of store.touristSites) {
    assert.ok(isUuid(s.id));
    assert.ok(govIds.has(s.governorateId), `site ${s.slug} references a missing governorate`);
    assert.ok(s.lat > 28 && s.lat < 38.5 && s.lng > 38 && s.lng < 49.5, `${s.slug} outside Iraq`);
  }
  assert.equal(new Set(store.touristSites.map((s) => s.slug)).size, store.touristSites.length, "duplicate site slugs");
});

test("seed: no invented facts — hours/fees null, no published emergency numbers, no official advisories", () => {
  for (const s of store.touristSites) {
    assert.equal(s.openingHours, null);
    assert.equal(s.entranceFee, null);
    assert.notEqual(s.verificationStatus, "verified");
  }
  assert.equal(store.emergencyContacts.filter((e) => e.published).length, 0);
  assert.equal(store.safetyAdvisories.length, 0);
  for (const h of store.hotels) {
    assert.ok(h.isDemo && h.name.startsWith("[DEMO]"));
    assert.equal(h.phone, null);
  }
  for (const p of store.priceRecords) assert.ok(p.isDemo, "seed prices must be DEMO-labelled");
});

test("uid is deterministic and RFC-4122 shaped", () => {
  assert.equal(uid("baghdad"), uid("baghdad"));
  assert.notEqual(uid("baghdad"), uid("basra"));
  assert.match(uid("x"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("access: official 'against all travel' advisory excludes sites in that governorate", () => {
  const hatra = store.touristSites.find((s) => s.slug === "hatra")!;
  assert.equal(siteAccess(hatra, []).allowed, true);
  const adv = advisory({ governorateIds: [hatra.governorateId] });
  assert.equal(siteAccess(hatra, [adv]).allowed, false);
  assert.equal(siteAccess(hatra, [advisory({ governorateIds: [hatra.governorateId], kind: "user_report" })]).allowed, true, "user reports never block");
  assert.equal(siteAccess(hatra, [advisory({ governorateIds: [hatra.governorateId], expiresAt: "2020-01-01T00:00:00Z" })]).allowed, true, "expired advisories ignored");
  assert.equal(siteAccess({ ...hatra, accessStatus: "closed" }, []).allowed, false);
});

test("planner: builds a day per date, starts at arrival and ends at departure", () => {
  const plan = buildPlan(input(), plannerData());
  assert.equal(plan.days.length, 7);
  assert.equal(plan.days[0].governorateId, uid("baghdad"));
  assert.equal(plan.days.at(-1)!.governorateId, uid("basra"));
  assert.equal(plan.days[0].date, "2027-03-01");
  assert.ok(plan.days.some((d) => d.stops.length > 0));
  assert.ok(plan.warnings.includes("uses_demo_data"));
  assert.ok(plan.incomplete, "entrance fees are unverified, so totals must be flagged incomplete");
  assert.equal(plan.days.at(-1)!.costs.hotel.amountIqd, 0, "no hotel on departure day");
  assert.ok(plan.totalIqd > 0);
});

test("planner: excludes sites under an active official advisory", () => {
  const nineveh = uid("nineveh");
  const plan = buildPlan(input({ interests: ["archaeology"], endDate: "2027-03-14" }), plannerData([advisory({ governorateIds: [nineveh] })]));
  const planned = plan.days.flatMap((d) => d.stops.map((s) => s.siteId));
  const ninevehSites = store.touristSites.filter((s) => s.governorateId === nineveh).map((s) => s.id);
  assert.ok(ninevehSites.length > 0);
  for (const id of ninevehSites) assert.ok(!planned.includes(id), "advisory-covered site was planned");
  assert.ok(plan.excluded.length >= ninevehSites.length);
});

test("planner: invalid dates produce no plan", () => {
  assert.equal(tripLength("2027-03-05", "2027-03-01"), 0);
  assert.equal(buildPlan(input({ startDate: "2027-03-05", endDate: "2027-03-01" }), plannerData()).days.length, 0);
  assert.equal(tripLength("2027-01-01", "2027-12-31"), 21, "capped at 21 days");
});

test("money & geo", () => {
  assert.equal(toIqd(10, "USD", 1310), 13100);
  assert.match(dualPrice(10000, "IQD", 1310), /IQD \(≈ \$7/);
  const ur = store.touristSites.find((s) => s.slug === "ziggurat-of-ur")!;
  const babylon = store.touristSites.find((s) => s.slug === "babylon-ancient-city")!;
  const d = haversineKm(ur, babylon);
  assert.ok(d > 225 && d < 250, `Ur–Babylon ${d}`);
});

test("i18n: locale switch keeps the page; dictionaries fall back to English", () => {
  assert.equal(switchLocalePath("/en/destinations/babylon", "ar"), "/ar/destinations/babylon");
  assert.equal(switchLocalePath("/fr", "de"), "/de");
  assert.equal(getDictionary("ar").nav.home, "الرئيسية");
  assert.equal(getDictionary("de").safety.intro, getDictionary("en").safety.intro, "sensitive text falls back to English");
  for (const l of ["en", "ar", "ckb", "fr", "de", "es"] as const) assert.ok(getDictionary(l).home.heroTitle.length > 0);
});

test("admin form: validation rejects bad data", () => {
  const cfg = ENTITIES.priceRecords!;
  const fd = new FormData();
  for (const [k, v] of Object.entries({ category: "taxi", item: "Ride", min: "10", avg: "5", max: "20", currency: "IQD", unit: "per trip", lastUpdated: "2026-11-19", verificationStatus: "unverified" })) fd.set(k, v);
  const { errors } = parseEntityForm(cfg, fd);
  assert.ok(errors.avg, "min ≤ avg ≤ max enforced");
  assert.ok(parseImages("http://insecure.example/x.jpg | a | b | c | d | yes").error);
  assert.ok(parseImages("https://x.example/a.jpg | alt |  |  | | yes").error, "credit and licence required");
  assert.equal(parseImages("https://x.example/a.jpg | alt | Author | CC BY 4.0 | https://src | yes").images[0].verified, true);
});

test("verification: levels require approved documents; permissions per role", () => {
  assert.equal(maxApprovedLevel([]), "unverified");
  assert.equal(levelAllowed("contact_verified", []), false);
  assert.equal(levelAllowed("documents_checked", [{ status: "approved", requestedLevel: "license_verified" }]), true);
  assert.equal(levelAllowed("license_verified", [{ status: "pending", requestedLevel: "license_verified" }]), false);
  assert.equal(canManage("editor", "priceRecords"), false);
  assert.equal(canManage("price_manager", "priceRecords"), true);
  assert.equal(canManage("safety_editor", "touristSites"), false);
  assert.equal(canManage("editor", "users"), false);
  assert.equal(canManage("super_admin", "users"), true);
  assert.equal(canSetProviderLevel("editor"), false);
  assert.equal(canSetProviderLevel("verification_officer"), true);
  assert.equal(canMarkVerified("editor", "safetyAdvisories"), false);
});

test("staleness", () => {
  assert.equal(isStale(null), true);
  assert.equal(isStale(new Date().toISOString()), false);
  assert.equal(isStale("2020-01-01"), true);
});

test("photo catalog: every entry maps to an existing site; unverified photos never publish", async () => {
  const { PHOTO_CATALOG } = await import("../src/data/photo-catalog");
  const manifest = (await import("../src/data/image-manifest.json")).default as { site_id: string; verification_status: string }[];
  const { manifestPhotos } = await import("../src/lib/photos");
  const slugs = new Set(store.touristSites.map((s) => s.slug));
  assert.equal(PHOTO_CATALOG.length, 25);
  for (const e of PHOTO_CATALOG) {
    assert.ok(slugs.has(e.siteSlug), `catalog ${e.folder} -> missing site ${e.siteSlug}`);
    for (const extra of e.alsoSiteSlugs ?? []) assert.ok(slugs.has(extra), `missing site ${extra}`);
  }
  assert.equal(new Set(PHOTO_CATALOG.map((e) => e.folder)).size, 25, "duplicate folders");
  assert.equal(manifest.length, 25);
  // Unverified local photo-pack entries never publish; sites may still show reviewed Commons photos.
  for (const m of manifest as { site_id: string; folder: string; verification_status: string }[]) {
    if (m.verification_status === "verified") continue;
    for (const img of manifestPhotos(m.site_id)) {
      assert.ok(!img.url.includes(`/images/iraq/${m.folder}/`), `unverified local photo published for ${m.site_id}`);
      assert.ok(img.url.startsWith("https://upload.wikimedia.org/") && img.credit && img.license, "fallback photos must be attributed Commons files");
    }
  }
});
