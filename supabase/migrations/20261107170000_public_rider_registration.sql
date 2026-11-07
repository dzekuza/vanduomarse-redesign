-- Vanduo Marse: public rider self-registration at /registracija (ADR-0043).
--
-- Visitors can now create their own `riders` row before showing up at the
-- till — contact details, a profile photo and a signed copy of the park's
-- two rule documents — so staff only have to find them by name ("Esamas
-- naudotojas" in Pardavimas) and assign a plan + bracelet. Follows the
-- existing public-write contract (ADR-0010): anon never touches a table or
-- a bucket directly, only two new `security definer` RPCs plus two
-- narrowly-scoped Storage insert policies that only match a row this flow
-- itself just created.

-- ---------------------------------------------------------------------------
-- riders: flag self-registered rows (also scopes the Storage policies below)
-- ---------------------------------------------------------------------------

alter table public.riders add column self_registered boolean not null default false;

-- ---------------------------------------------------------------------------
-- rider_waivers: one row per registration, the signed rules consent
-- ---------------------------------------------------------------------------

create table public.rider_waivers (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  terms_version text not null,
  signature_path text,
  signed_at timestamptz not null default now()
);
create index rider_waivers_rider_idx on public.rider_waivers (rider_id);

alter table public.rider_waivers enable row level security;
revoke all on public.rider_waivers from anon;

create policy "apyrankes rider waivers read" on public.rider_waivers
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "klientai rider waivers read" on public.rider_waivers
  for select to authenticated using ((select private.has_permission('klientai')));

-- ---------------------------------------------------------------------------
-- Storage: signature PNGs (profile photos reuse the existing rider-photos
-- bucket — no change needed there for staff access).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rider-waivers', 'rider-waivers', false, 2097152, array['image/png'])
on conflict (id) do nothing;

create policy "apyrankes rider waivers storage read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-waivers' and (select private.has_permission('apyrankes')));
create policy "klientai rider waivers storage read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-waivers' and (select private.has_permission('klientai')));

-- Anon may only drop a file for a row this same flow just created, and only
-- once: the moment register_rider_public / finalize_rider_registration_public
-- sets avatar_path / signature_path, the matching `exists` stops matching, so
-- there is nothing left to overwrite or append to. No anon select/update/delete.
create policy "public rider photo upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'rider-photos'
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(name))[1] and r.self_registered and r.avatar_path is null
    )
  );

create policy "public rider waiver upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'rider-waivers'
    and exists (
      select 1 from public.rider_waivers w
      where w.rider_id::text = (storage.foldername(name))[1] and w.signature_path is null
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs: the only way anon can create a rider or link an uploaded file to one
-- ---------------------------------------------------------------------------

create or replace function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text,
  p_birthdate date, p_terms_version text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_rider_id uuid;
begin
  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true)
  returning id into v_rider_id;

  insert into public.rider_waivers (rider_id, terms_version) values (v_rider_id, p_terms_version);

  return v_rider_id;
end;
$$;
revoke all on function public.register_rider_public from public;
grant execute on function public.register_rider_public to anon;

create or replace function public.finalize_rider_registration_public(
  p_rider_id uuid, p_avatar_path text, p_signature_path text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.riders set avatar_path = p_avatar_path
    where id = p_rider_id and self_registered and avatar_path is null;

  update public.rider_waivers set signature_path = p_signature_path
    where rider_id = p_rider_id and signature_path is null;
end;
$$;
revoke all on function public.finalize_rider_registration_public from public;
grant execute on function public.finalize_rider_registration_public to anon;
