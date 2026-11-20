# IRAQ TRAVEL

**Discover the Land Between Two Rivers.**

A multilingual tourism information platform for Iraq. It covers destinations, a UNESCO heritage guide, a smart trip planner, the IRAQ FAIR PRICE reference, hotels, restaurants, transport, an interactive map, a safety center, traveler protection (anti-scam), an emergency center and a role-based admin CMS.

> **Data integrity first.** The platform never invents prices, phone numbers, opening hours, licences, schedules or security data. Every factual record carries a verification status (*Verified, Partially verified, Estimated, Unverified, Outdated*). Missing facts are shown explicitly ("Price not verified", "Opening hours not confirmed", "Current information unavailable – Verify before travel."). Sample records are clearly labelled **DEMO**.

---

## 1. Quick start (local)

Requirements: Node.js ≥ 20.

```bash
cd iraq-travel
npm install
cp .env.example .env.local        # optional for local dev — defaults work
npm run dev
```

Open **http://localhost:3000**. It redirects to your browser language, with English as the default.

### Demo admin (local development only)

Admin dashboard: **http://localhost:3000/admin**

| Role | Email | 
|---|---|
| Super Admin | `admin@iraqtravel.demo` |
| Editor | `editor@iraqtravel.demo` |
| Price Manager | `prices@iraqtravel.demo` |
| Safety Editor | `safety@iraqtravel.demo` |
| Verification Officer | `verify@iraqtravel.demo` |

Password: `IraqTravel-Demo-2026`, unless you set `DEMO_ADMIN_PASSWORD`.

Demo auth is **on automatically only when `NODE_ENV` is not `production` and Supabase is not configured**. It is never enabled in production unless you explicitly set `DEMO_AUTH_ENABLED=true`. In that case `DEMO_ADMIN_PASSWORD` (≥10 characters) and `AUTH_SECRET` (≥32 characters) are required.

### Local data store

Without Supabase, data is read from the seed in `src/data/` and admin edits are written to `.data/store.json` (git-ignored). Delete that folder to reset to the seed. Private verification documents go to `.data/private-docs/`, which is never served publicly.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (planner, advisory exclusion, validation, permissions, i18n, seed integrity) |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/data/` |

---

## 2. Technology

Next.js 16 (App Router, Server Actions, ISR) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Leaflet + OpenStreetMap (Mapbox optional) · Zod.

```
src/
  app/[locale]/…        public pages in 6 languages (en default, ar & ckb RTL)
  app/admin/…           admin CMS (own root layout, server-side role checks)
  app/actions/public.ts report / review / itinerary submissions (validated, rate-limited, honeypot)
  data/                 seed data + domain types (types.ts is the data model)
  i18n/                 locale config + dictionaries (English fallback)
  lib/planner.ts        trip-planner engine (pure, unit-tested)
  lib/access.ts         advisory-based site exclusion
  lib/store/            repository: local JSON file store  ⇄  Supabase
  lib/auth.ts           signed session cookie, scrypt (demo), Supabase Auth
  lib/permissions.ts    role → permission matrix
supabase/migrations/    schema, RLS, storage buckets
supabase/seed.sql       generated seed (demo rows flagged is_demo)
tests/                  node:test unit tests
```

---

## 3. Database (Supabase / PostgreSQL)

Tables: `governorates`, `tourist_sites`, `site_categories`, `hotels`, `restaurants`, `restaurant_menus`, `transport_routes`, `transport_providers`, `tour_guides`, `price_records`, `safety_advisories`, `travel_itineraries`, `bookings`, `reviews`, `scam_reports`, `verification_documents`, `emergency_contacts`, `official_sources`, `content_updates`, `users`, `admin_logs`.

* UUID primary keys, foreign keys, indexes (incl. GIN on arrays), `created_at`/`updated_at` with triggers.
* CHECK constraints for validation. Examples: coordinates must be inside Iraq, `min ≤ avg ≤ max` on prices, localized text must include English, an official advisory requires a source URL, and an emergency contact **cannot be published without an official source**.
* **Row Level Security** on every table. The public can read published content only, and can submit reports/reviews but never read them back. Staff policies mirror the app's role matrix. A trigger allows only verification officers to change `provider_level`, and an officer may change nothing else on that row. `admin_logs` is append-only.
* Storage: `public-media` (licensed photos, public read) and **`verification-docs` (private; officers only, short-lived signed URLs)**.

The migrations and seed were tested against PostgreSQL 16, including the RLS behaviour for anon, editor and verification-officer roles.

### Connect Supabase

1. Create a Supabase project.
2. Apply the migrations: `supabase link --project-ref <ref>` then `supabase db push`. Or paste the three files in `supabase/migrations/` into the SQL editor, in order.
3. Load seed data: run `supabase/seed.sql`. Optionally remove the demo rows afterwards: `delete from <table> where is_demo;`.
4. Create your first admin: create a user in **Authentication → Users**, then
   ```sql
   insert into public.users (id, email, display_name, role)
   values ('<auth user uuid>', 'you@example.com', 'Your Name', 'super_admin');
   ```
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `AUTH_SECRET` in `.env.local`. When Supabase is configured, the app uses it automatically and demo auth turns off.

---

## 4. Services that need API keys

| Service | Variable(s) | Required? | Without it |
|---|---|---|---|
| Supabase (DB, Auth, Storage) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | **Yes in production** | Local JSON store + demo auth (dev only) |
| Session signing | `AUTH_SECRET` (≥32 chars, e.g. `openssl rand -hex 32`) | **Yes in production** | Dev-only fallback secret |
| Mapbox tiles | `NEXT_PUBLIC_MAPBOX_TOKEN` | No | OpenStreetMap tiles (attribution shown) |
| Analytics | (provider of your choice) | No | No page-view analytics collected |
| Hotel / flight booking APIs | — | Not integrated | Booking is shown as **not available** |
| Live exchange rate | `NEXT_PUBLIC_IQD_PER_USD` (static reference) | No | Defaults to 1310 IQD/USD, labelled "verify with the Central Bank of Iraq" |

---

## 5. Deploying

**Vercel (recommended)**

1. Import the repository and set **Root Directory = `iraq-travel`**.
2. Add the environment variables from section 4 (Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to your domain, e.g. `https://iraqtravel.com`.
3. Deploy. The file-based demo store does **not** persist on serverless filesystems, so Supabase is required in production.
4. Add your domain. `sitemap.xml` and `robots.txt` use `NEXT_PUBLIC_SITE_URL`.

**Any Node host / Docker:** `npm ci && npm run build && npm start` (port 3000). Put it behind HTTPS.

**Before launch:** replace or delete DEMO records, have editors verify content, attach licensed photos, publish verified emergency numbers with their official source, enter current official advisories, and get the Kurdish (Sorani) strings reviewed by a native speaker.

---

## 6. Feature status

### Complete
* Premium responsive design (mobile → desktop), wordmark and illustrated hero, RTL support, reduced-motion support, skip link, accessible forms.
* 6 languages: en (default), ar, ckb (RTL), fr, de, es. The language switcher keeps the current page, and localized destination names are included. Safety/legal text intentionally stays in its reviewed English original, with a notice.
* Homepage sections A–J: hero, search (governorate / destination / category / budget / days), featured destinations, UNESCO, planner, safety, hotels, food, transport, footer.
* All 18 governorates with their own pages: history, geography, best time to visit, sites grouped by archaeological/natural/religious, activities, hotels, restaurants, transport, typical costs, safety, map and sources.
* Archaeological encyclopedia: **48 sites**, with Arabic and English names and descriptions, history, approximate coordinates, UNESCO links, restrictions, sources, last-verified date and status.
* UNESCO heritage page (6 Iraqi listings with links to whc.unesco.org).
* IRAQ FAIR PRICE: min/avg/max, IQD + USD, unit, city, provider, source, last updated, status, warnings for outdated/unverified records, managed from admin.
* Hotels and restaurants: categories, filters, detail pages, amenities, menus, provider verification badge, moderated reviews, no "safe/approved" claims.
* Transport guide with a comparison table. Schedules and fares appear only when verified.
* Smart trip planner: arrival/departure, dates, travelers, budget, interests, transport, hotel category → daily plan with distance, transport/hotel/food/entrance costs, daily and overall totals. You can edit, remove or add stops, then download, print or save. Sites under active official advisories are excluded automatically.
* Interactive map: layers, search, info popups, nearby attractions, distance, route builder, GPX/JSON download, and a warning that routes are straight-line legs, not verified roads.
* Safety center: official advisories kept separate from traveler reports, published/updated dates, "Current information unavailable – Verify before travel." when empty, links to official advisories.
* Traveler protection: four verification levels, provider directory, five report types, and an internal complaint log with an action history.
* Emergency center: shows only verified, sourced numbers. Personal emergency card stored on the device, offline caching via service worker, downloadable card.
* Admin: CRUD for all content, prices, safety alerts, emergency contacts, sources, reviews, images (URL + credit + licence) and translations coverage; complaints review, provider verification with private document upload, users and roles, audit log, change history, content-health analytics. Five staff roles are enforced server-side and by RLS.
* SEO: per-page metadata, canonical + hreflang, sitemap with alternates, robots.txt, JSON-LD (WebSite, TouristAttraction, Museum, AdministrativeArea), Open Graph image, clean URLs (`/en/destinations/ur`, `/en/destinations/babylon`, `/en/destinations/baghdad`), and 460 statically generated pages with ISR.
* Security: signed httpOnly session cookie, scrypt hashing, role re-checked from the DB on every request, login rate limiting, Zod validation, honeypots, escaped map popups, security headers, private document storage, no secrets in the repository.

### Incomplete / needs real-world input
* **Verified data.** No content was verified against official sources during development: outbound access to gov.uk, UNESCO, Wikimedia and similar sites was blocked in the build environment. Everything real is marked *Unverified*, and coordinates are marked approximate.
* **Photographs.** None are bundled, to avoid misattributed images. Wikimedia Commons is blocked by the build environment's network, so photos must be added by an editor in the admin, or fetched once that network access is allowed. Pages show an illustrated placeholder marked "Verified photo pending" until editors attach licensed photos.
* **Emergency numbers.** Commonly cited national numbers exist only as **unpublished drafts** in the admin, pending official confirmation.
* **Advisories.** No official advisories are seeded, because they can't be entered without a current source.
* **Hotels, restaurants and prices** are DEMO samples only.
* **Translations.** The interface is fully translated in all six languages. Long safety/legal guidance stays in its reviewed English original outside English and Arabic. Destination descriptions in Kurdish, French, German and Spanish still fall back to English with a notice, and the Kurdish interface needs native-speaker review.
* **Image upload** to Supabase Storage from the admin UI: photos are added by URL for now. The bucket and policies already exist.
* **Booking, live prices, live flight schedules and page-view analytics** are not integrated.
* **Rate limiting** is in-memory per instance. Use a shared store such as Redis or Upstash for multi-instance production.

---

## 7. Site photographs (photo pack)

The 25 entries of the *IRAQ TRAVEL Archaeological Photo Catalog* are defined in `src/data/photo-catalog.ts`, and each has a folder in `public/images/iraq/<folder>/`.

1. Put the licensed files in the folder using the catalog's names: `<folder>-hero.jpg`, `<folder>-gallery-01.jpg`, `<folder>-thumbnail.jpg`.
2. Add `credits.json` next to them: `photographer`, `license`, `source_url`, `attribution`, and optionally `alt_en` / `alt_ar`.
3. Run `npm run photos:import`. This regenerates `src/data/image-manifest.json` and `src/data/missing-images.json`.
4. A person checks that each photo shows the exact place and that its licence is valid. They then add `"verification_status": "verified"`, `"verified_by"` and `"verified_at"` to `credits.json`, and run the import again.

Only **verified** entries appear on the public site, as the hero image plus a gallery with credit and licence. The script never marks a photo verified on its own. Photos attached to a site in the admin CMS take precedence over the manifest.

## 8. Content sources

The initial list (verify the links and their terms of use): UNESCO World Heritage Centre, the Iraqi Ministry of Culture, Tourism and Antiquities, Iraqi Airways, OpenStreetMap, UK FCDO travel advice and the U.S. Department of State. Manage them under **Admin → Sources**.

---

## ملخص بالعربية

منصة **IRAQ TRAVEL** موقع سياحي متعدد اللغات يعمل بست لغات: الإنجليزية (افتراضية)، والعربية والكردية (من اليمين إلى اليسار)، والفرنسية، والألمانية، والإسبانية. للتشغيل محلياً: `cd iraq-travel && npm install && npm run dev` ثم افتح `http://localhost:3000`. لوحة الإدارة على `/admin` بحساب `admin@iraqtravel.demo` وكلمة المرور `IraqTravel-Demo-2026`، وهذا للتطوير المحلي فقط. لا يخترع الموقع أسعاراً أو أرقاماً أو أوقاتاً أو بيانات أمنية؛ كل معلومة تحمل حالة تحقق، والبيانات التجريبية موسومة بكلمة **DEMO**. يتطلب النشر للإنتاج إعداد Supabase وضبط `AUTH_SECRET`.
