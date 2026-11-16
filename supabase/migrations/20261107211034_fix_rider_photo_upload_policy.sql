-- Fix: "public rider photo upload" (20261107170000_public_rider_registration.sql)
-- referenced a bare `name` inside its EXISTS subquery, which Postgres resolved
-- to riders.name (the rider's first name) instead of storage.objects.name (the
-- uploaded path), because riders has its own `name` column. The check could
-- never match, so every anon photo upload from /registracija was silently
-- rejected (the rider row and waiver still got created). rider_waivers has no
-- `name` column, so the sibling waiver-upload policy was unaffected.

drop policy "public rider photo upload" on storage.objects;

create policy "public rider photo upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'rider-photos'
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1] and r.self_registered and r.avatar_path is null
    )
  );
