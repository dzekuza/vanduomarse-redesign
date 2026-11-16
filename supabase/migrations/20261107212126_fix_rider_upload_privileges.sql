-- Fix: the two "public rider ... upload" Storage policies (from
-- 20261107170000_public_rider_registration.sql, patched once already in
-- 20261107171000) check `riders`/`rider_waivers` directly in their EXISTS
-- subquery. Evaluated as the `anon` role, that subquery doesn't just hit
-- RLS — `anon` has no SELECT grant on either table at all ("permission
-- denied for table riders"), so the check always silently failed and BOTH
-- the photo and the signature upload were rejected on every /registracija
-- submission, not just the photo (the 20261107171000 patch fixed a real
-- but secondary bug — a column-name collision — in the same subquery, but
-- never reached the table at all because of this).
--
-- Fix: two new `security definer` helper functions, same pattern as the
-- existing `private.has_permission` (owned by the table owner, so they
-- bypass both the grant and RLS checks), called from the policies instead
-- of querying the tables directly. They live in `public` (not `private`,
-- which `anon` has no USAGE on) and are granted EXECUTE to `anon` only for
-- this purpose — each just answers "is this specific row still waiting for
-- its file", a narrow boolean, not a general read of the table.

create or replace function public.rider_awaiting_photo(p_rider_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.riders r
    where r.id = p_rider_id and r.self_registered and r.avatar_path is null
  );
$$;
revoke all on function public.rider_awaiting_photo from public;
grant execute on function public.rider_awaiting_photo to anon;

create or replace function public.rider_waiver_awaiting_signature(p_rider_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rider_waivers w
    where w.rider_id = p_rider_id and w.signature_path is null
  );
$$;
revoke all on function public.rider_waiver_awaiting_signature from public;
grant execute on function public.rider_waiver_awaiting_signature to anon;

drop policy "public rider photo upload" on storage.objects;
create policy "public rider photo upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'rider-photos'
    and public.rider_awaiting_photo(nullif((storage.foldername(objects.name))[1], '')::uuid)
  );

drop policy "public rider waiver upload" on storage.objects;
create policy "public rider waiver upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'rider-waivers'
    and public.rider_waiver_awaiting_signature(nullif((storage.foldername(objects.name))[1], '')::uuid)
  );
