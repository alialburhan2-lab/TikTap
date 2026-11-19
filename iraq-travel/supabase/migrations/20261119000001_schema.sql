-- =====================================================================
-- IRAQ TRAVEL — core schema
-- Column names are the snake_case form of the TypeScript model fields
-- (src/data/types.ts). Localized text is jsonb: {"en": "...", "ar": "...", ...}.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type public.verification_status as enum ('verified', 'partially_verified', 'estimated', 'unverified', 'outdated');
create type public.provider_level as enum ('unverified', 'contact_verified', 'documents_checked', 'license_verified');
create type public.app_role as enum ('super_admin', 'editor', 'price_manager', 'safety_editor', 'verification_officer', 'traveler');

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- localized jsonb must contain an English original
create or replace function public.has_en(j jsonb) returns boolean language sql immutable as $$
  select j is not null and jsonb_typeof(j) = 'object' and coalesce(length(j->>'en'), 0) > 0
$$;

-- ---------- official_sources ----------
create table public.official_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  url text not null check (url ~ '^https?://'),
  type text not null check (type in ('government', 'unesco', 'carrier', 'map_data', 'advisory', 'other')),
  notes text,
  terms_reviewed boolean not null default false,
  last_checked date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- governorates ----------
create table public.governorates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.has_en(name)),
  region text not null check (region in ('federal', 'kurdistan_region')),
  capital jsonb not null check (public.has_en(capital)),
  summary jsonb not null check (public.has_en(summary)),
  history jsonb,
  geography jsonb,
  best_time_to_visit jsonb,
  lat double precision not null check (lat between 28 and 38.5),
  lng double precision not null check (lng between 38 and 49.5),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  source_ids uuid[] not null default '{}',
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- site_categories (lookup / translations) ----------
create table public.site_categories (
  id text primary key check (id ~ '^[a-z_]+$'),
  name jsonb not null check (public.has_en(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.site_categories (id, name) values
  ('archaeological', '{"en":"Archaeological","ar":"أثري"}'),
  ('religious', '{"en":"Religious heritage","ar":"تراث ديني"}'),
  ('natural', '{"en":"Nature","ar":"طبيعة"}'),
  ('museum', '{"en":"Museum","ar":"متحف"}'),
  ('historic_city', '{"en":"Historic city","ar":"مدينة تاريخية"}'),
  ('market', '{"en":"Market","ar":"سوق"}'),
  ('park', '{"en":"Park","ar":"متنزه"}'),
  ('cultural', '{"en":"Culture","ar":"ثقافة"}');

-- ---------- tourist_sites ----------
create table public.tourist_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  governorate_id uuid not null references public.governorates(id) on delete restrict,
  name jsonb not null check (public.has_en(name)),
  categories text[] not null check (cardinality(categories) > 0 and categories <@ array['archaeological','religious','natural','museum','historic_city','market','park','cultural']),
  interests text[] not null default '{}' check (interests <@ array['archaeology','history','nature','food','religious','culture','entertainment']),
  summary jsonb not null check (public.has_en(summary)),
  history jsonb,
  lat double precision not null check (lat between 28 and 38.5),
  lng double precision not null check (lng between 38 and 49.5),
  coordinates_approximate boolean not null default true,
  unesco jsonb,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  opening_hours text,          -- NULL => "Opening hours not confirmed"
  entrance_fee text,           -- NULL => "Price not verified"
  visitor_restrictions text,
  accessibility text,
  access_status text not null default 'unknown' check (access_status in ('open', 'restricted', 'closed', 'unknown')),
  recommended_visit_hours numeric(4,1) not null default 2 check (recommended_visit_hours > 0 and recommended_visit_hours <= 24),
  source_ids uuid[] not null default '{}',
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  featured boolean not null default false,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- hotels ----------
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 200),
  governorate_id uuid not null references public.governorates(id) on delete restrict,
  city text not null,
  category text not null check (category in ('budget', 'mid_range', 'luxury', 'family', 'boutique')),
  address text,
  lat double precision check (lat between 28 and 38.5),
  lng double precision check (lng between 38 and 49.5),
  phone text check (phone ~ '^[0-9 +()-]{5,25}$'),
  whatsapp text check (whatsapp ~ '^[0-9 +()-]{5,25}$'),
  room_price_min_usd numeric(10,2) check (room_price_min_usd >= 0),
  room_price_max_usd numeric(10,2) check (room_price_max_usd >= 0),
  breakfast boolean,
  wifi boolean,
  air_conditioning boolean,
  parking boolean,
  facilities text[] not null default '{}',
  cancellation_policy text,
  booking_contact text,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  provider_level public.provider_level not null default 'unverified',
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (room_price_min_usd is null or room_price_max_usd is null or room_price_min_usd <= room_price_max_usd)
);

-- ---------- restaurants ----------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 200),
  governorate_id uuid not null references public.governorates(id) on delete restrict,
  city text not null,
  categories text[] not null check (cardinality(categories) > 0 and categories <@ array['iraqi_traditional','fine_dining','international','family','vegetarian','halal','cafe','desserts']),
  address text,
  lat double precision check (lat between 28 and 38.5),
  lng double precision check (lng between 38 and 49.5),
  opening_hours text,
  contact text,
  dietary text[] not null default '{}',
  average_cost_iqd numeric(12,0) check (average_cost_iqd >= 0),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  provider_level public.provider_level not null default 'unverified',
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price_iqd numeric(12,0) check (price_iqd >= 0),
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- transport ----------
create table public.transport_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  modes text[] not null check (cardinality(modes) > 0 and modes <@ array['domestic_flight','train','intercity_bus','private_car','taxi','airport_transfer']),
  website text check (website ~ '^https?://'),
  phone text,
  notes text,
  provider_level public.provider_level not null default 'unverified',
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('domestic_flight','train','intercity_bus','private_car','taxi','airport_transfer')),
  from_governorate_id uuid not null references public.governorates(id) on delete restrict,
  to_governorate_id uuid not null references public.governorates(id) on delete restrict,
  provider_id uuid references public.transport_providers(id) on delete set null,
  price_min_iqd numeric(12,0) check (price_min_iqd >= 0),
  price_max_iqd numeric(12,0) check (price_max_iqd >= 0),
  duration_minutes integer check (duration_minutes > 0),
  departure text,   -- only verified schedules
  arrival text,
  luggage text,
  booking_method text,
  notes text,
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_min_iqd is null or price_max_iqd is null or price_min_iqd <= price_max_iqd)
);

create table public.tour_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('guide', 'agency', 'driver')),
  languages text[] not null default '{}',
  governorate_ids uuid[] not null default '{}',
  phone text,
  license_number text,
  provider_level public.provider_level not null default 'unverified',
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- IRAQ FAIR PRICE ----------
create table public.price_records (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('restaurant','hotel','taxi','private_driver','domestic_transport','tour_guide','entrance_fee','activity')),
  item text not null,
  governorate_id uuid references public.governorates(id) on delete set null,
  city text,
  provider text,
  min numeric(14,2) not null check (min >= 0),
  avg numeric(14,2) not null check (avg >= 0),
  max numeric(14,2) not null check (max >= 0),
  currency text not null check (currency in ('IQD', 'USD')),
  unit text not null,
  source_id uuid references public.official_sources(id) on delete set null,
  source_note text,
  last_updated date not null,
  verification_status public.verification_status not null default 'unverified',
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min <= avg and avg <= max)
);

-- ---------- safety ----------
create table public.safety_advisories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('official', 'user_report')),
  issuer text not null,
  title text not null,
  body text not null,
  level text not null check (level in ('info','caution','reconsider_travel','against_all_but_essential','against_all_travel')),
  category text not null check (category in ('government_advisory','local_restriction','road_condition','entry_requirement','site_access','medical','emergency_guidance','photography','insurance')),
  governorate_ids uuid[] not null default '{}',
  site_ids uuid[] not null default '{}',
  source_url text check (source_url ~ '^https?://'),
  published_at timestamptz not null,
  expires_at timestamptz,
  active boolean not null default true,
  verification_status public.verification_status not null default 'unverified',
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'official' or source_url is not null)
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('emergency_number','hospital','ambulance','police','fire','embassy','insurance')),
  name text not null,
  phone text,
  address text,
  governorate_id uuid references public.governorates(id) on delete set null,
  source_id uuid references public.official_sources(id) on delete set null,
  notes text,
  verification_status public.verification_status not null default 'unverified',
  last_verified date,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not published or source_id is not null)   -- never publish a number without an official source
);

-- ---------- traveler protection ----------
create table public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('fraud','overcharging','fake_booking','incorrect_price','complaint')),
  provider_name text not null check (length(provider_name) between 2 and 160),
  provider_type text,
  governorate_id uuid references public.governorates(id) on delete set null,
  description text not null check (length(description) between 20 and 4000),
  amount_paid text,
  expected_amount text,
  incident_date date,
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status text not null default 'new' check (status in ('new','under_review','action_taken','dismissed')),
  actions jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  provider_type text not null check (provider_type in ('hotel','restaurant','tourGuide','transportProvider')),
  provider_id uuid not null,
  doc_type text not null check (doc_type in ('business_license','tourism_license','identity','contact_check','other')),
  storage_path text,  -- path in the PRIVATE bucket "verification-docs"
  requested_level public.provider_level not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('hotel','restaurant','site','tourGuide')),
  target_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (length(title) between 3 and 120),
  body text not null check (length(body) between 20 and 3000),
  author_name text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- users & planning ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role public.app_role not null default 'traveler',
  disabled boolean not null default false,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.travel_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  input jsonb not null,
  days jsonb not null,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Online booking is NOT available until real providers are integrated.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  status text not null default 'not_available' check (status = 'not_available'),
  note text not null default 'Online booking not available',
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- audit ----------
create table public.content_updates (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  record_id uuid not null,
  summary text not null,
  actor_email text not null,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_email text not null,
  action text not null,
  entity text not null,
  record_id uuid,
  details text,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index on public.tourist_sites (governorate_id);
create index on public.tourist_sites (published, verification_status);
create index on public.tourist_sites using gin (categories);
create index on public.tourist_sites using gin (interests);
create index on public.hotels (governorate_id, category);
create index on public.restaurants (governorate_id);
create index on public.restaurants using gin (categories);
create index on public.restaurant_menus (restaurant_id);
create index on public.transport_routes (from_governorate_id, to_governorate_id);
create index on public.transport_routes (provider_id);
create index on public.price_records (category, governorate_id);
create index on public.price_records (last_updated);
create index on public.safety_advisories (active, published_at desc);
create index on public.safety_advisories using gin (governorate_ids);
create index on public.safety_advisories using gin (site_ids);
create index on public.emergency_contacts (kind, governorate_id);
create index on public.scam_reports (status, created_at desc);
create index on public.verification_documents (provider_type, provider_id);
create index on public.verification_documents (status);
create index on public.reviews (target_type, target_id, status);
create index on public.content_updates (entity, record_id);
create index on public.admin_logs (created_at desc);
create index on public.admin_logs (actor_id);
create index on public.travel_itineraries (user_id);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['official_sources','governorates','site_categories','tourist_sites','hotels','restaurants','restaurant_menus','transport_providers','transport_routes','tour_guides','price_records','safety_advisories','emergency_contacts','scam_reports','verification_documents','reviews','users','travel_itineraries','bookings','content_updates','admin_logs']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
