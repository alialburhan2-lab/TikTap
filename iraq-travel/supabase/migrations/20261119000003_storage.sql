-- =====================================================================
-- Storage buckets
--   public-media      : verified, licensed photographs (public read, editors write)
--   verification-docs : SENSITIVE provider documents (private; verification officers only)
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-docs', 'verification-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "public media read" on storage.objects for select using (bucket_id = 'public-media');
create policy "editors upload media" on storage.objects for insert with check (bucket_id = 'public-media' and public.has_role('{editor}'));
create policy "editors manage media" on storage.objects for update using (bucket_id = 'public-media' and public.has_role('{editor}'));
create policy "editors delete media" on storage.objects for delete using (bucket_id = 'public-media' and public.has_role('{editor}'));

-- No public policy exists for verification-docs. Only verification officers (or the server's service role) can access it.
create policy "officers read docs" on storage.objects for select using (bucket_id = 'verification-docs' and public.has_role('{verification_officer}'));
create policy "officers upload docs" on storage.objects for insert with check (bucket_id = 'verification-docs' and public.has_role('{verification_officer}'));
