-- =====================================================================
-- Row Level Security
-- The Next.js server performs its own role checks and then uses the
-- service-role key; these policies protect any direct access with the
-- public anon key (defence in depth).
-- =====================================================================

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid() and not disabled
$$;

create or replace function public.has_role(roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'super_admin' or public.current_app_role() = any(roles), false)
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.has_role(public.app_role[]) to anon, authenticated;

-- Enable RLS everywhere
do $$
declare t text;
begin
  foreach t in array array['official_sources','governorates','site_categories','tourist_sites','hotels','restaurants','restaurant_menus','transport_providers','transport_routes','tour_guides','price_records','safety_advisories','emergency_contacts','scam_reports','verification_documents','reviews','users','travel_itineraries','bookings','content_updates','admin_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------- public read of published content ----------
do $$
declare t text;
begin
  foreach t in array array['official_sources','governorates','tourist_sites','hotels','restaurants','restaurant_menus','transport_providers','transport_routes','tour_guides','price_records','safety_advisories']
  loop
    execute format('create policy "public read published" on public.%I for select using (published = true)', t);
  end loop;
end $$;
create policy "public read categories" on public.site_categories for select using (true);
-- emergency contacts: only published AND verified/partially verified with a source
create policy "public read verified emergency" on public.emergency_contacts for select
  using (published and source_id is not null and verification_status in ('verified', 'partially_verified'));
-- reviews: only approved
create policy "public read approved reviews" on public.reviews for select using (published and status = 'approved');

-- ---------- staff write policies (mirror src/lib/permissions.ts) ----------
create or replace function public._staff_policy(tbl text, roles text) returns void language plpgsql as $$
begin
  execute format('create policy "staff select" on public.%I for select using (public.has_role(%L::public.app_role[]))', tbl, roles);
  execute format('create policy "staff insert" on public.%I for insert with check (public.has_role(%L::public.app_role[]))', tbl, roles);
  execute format('create policy "staff update" on public.%I for update using (public.has_role(%L::public.app_role[])) with check (public.has_role(%L::public.app_role[]))', tbl, roles, roles);
  execute format('create policy "staff delete" on public.%I for delete using (public.has_role(%L::public.app_role[]))', tbl, roles);
end $$;

do $$ begin
  perform public._staff_policy('governorates', '{editor}');
  perform public._staff_policy('site_categories', '{editor}');
  perform public._staff_policy('tourist_sites', '{editor}');
  perform public._staff_policy('hotels', '{editor}');
  perform public._staff_policy('restaurants', '{editor}');
  perform public._staff_policy('restaurant_menus', '{editor,price_manager}');
  perform public._staff_policy('transport_providers', '{editor}');
  perform public._staff_policy('transport_routes', '{editor,price_manager}');
  perform public._staff_policy('tour_guides', '{editor}');
  perform public._staff_policy('price_records', '{price_manager}');
  perform public._staff_policy('safety_advisories', '{safety_editor}');
  perform public._staff_policy('emergency_contacts', '{safety_editor}');
  perform public._staff_policy('official_sources', '{editor,safety_editor}');
  perform public._staff_policy('reviews', '{editor}');
  perform public._staff_policy('scam_reports', '{verification_officer}');
  perform public._staff_policy('verification_documents', '{verification_officer}');
  perform public._staff_policy('bookings', '{}');
end $$;
drop function public._staff_policy(text, text);

-- Provider levels: only verification officers (or super admins) may change them, and an officer
-- may change NOTHING else on a provider row.
create or replace function public.guard_provider_level() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;  -- service role / server
  if new.provider_level is distinct from old.provider_level and not public.has_role('{verification_officer}') then
    raise exception 'Only verification officers can change provider_level';
  end if;
  if public.current_app_role() = 'verification_officer'
     and (to_jsonb(new) - 'provider_level' - 'updated_at') is distinct from (to_jsonb(old) - 'provider_level' - 'updated_at') then
    raise exception 'Verification officers may only change provider_level';
  end if;
  return new;
end $$;
create trigger guard_provider_level before update on public.hotels for each row execute function public.guard_provider_level();
create trigger guard_provider_level before update on public.restaurants for each row execute function public.guard_provider_level();
create trigger guard_provider_level before update on public.tour_guides for each row execute function public.guard_provider_level();
create trigger guard_provider_level before update on public.transport_providers for each row execute function public.guard_provider_level();

do $$
declare t text;
begin
  foreach t in array array['hotels','restaurants','tour_guides','transport_providers']
  loop
    execute format('create policy "officers read providers" on public.%I for select using (public.has_role(''{verification_officer}''))', t);
    execute format('create policy "officers set level" on public.%I for update using (public.has_role(''{verification_officer}'')) with check (public.has_role(''{verification_officer}''))', t);
  end loop;
end $$;

-- ---------- anonymous submissions ----------
-- Travelers may submit reports and reviews, but cannot read them back or choose their status.
create policy "anyone can report" on public.scam_reports for insert to anon, authenticated
  with check (status = 'new' and published = false and actions = '[]'::jsonb);
create policy "anyone can review" on public.reviews for insert to anon, authenticated
  with check (status = 'pending');
create policy "anyone can save itinerary" on public.travel_itineraries for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "owner reads itinerary" on public.travel_itineraries for select using (user_id is not null and user_id = auth.uid());

-- ---------- users ----------
create policy "read own profile" on public.users for select using (id = auth.uid());
create policy "super admin manages users" on public.users for all using (public.has_role('{}')) with check (public.has_role('{}'));

-- ---------- audit (append-only for staff, readable by super admin) ----------
create policy "staff append logs" on public.admin_logs for insert
  with check (public.has_role('{editor,price_manager,safety_editor,verification_officer}') and actor_id = auth.uid());
create policy "super admin reads logs" on public.admin_logs for select using (public.has_role('{}'));
create policy "staff append updates" on public.content_updates for insert
  with check (public.has_role('{editor,price_manager,safety_editor,verification_officer}'));
create policy "staff read updates" on public.content_updates for select
  using (public.has_role('{editor,price_manager,safety_editor,verification_officer}'));
-- no update/delete policies on admin_logs => immutable for non-service roles
