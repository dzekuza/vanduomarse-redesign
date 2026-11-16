-- Two gaps in 20261116181848 (ADR-0106), found in review:
-- 1. Only p_phone and p_email were checked for an existing customer. A registration that put someone else's number in
--    phone2 matched nobody, so it became an ordinary (non-duplicate) row; once it had a photo, private.find_rider picked
--    it first for that number, and new orders from that number linked to it. Now phone2 is checked too, under its own
--    advisory lock.
-- 2. `duplicate_of ... on delete set null` cleared the flag when staff deleted the original customer, silently turning
--    the unverified row into a trusted one. Now `on delete restrict`: the original cannot be deleted while a duplicate
--    points at it (admin already reports 23503 as "linked to other data"); staff resolve the duplicate first.

alter table public.riders drop constraint riders_duplicate_of_fkey;
alter table public.riders
  add constraint riders_duplicate_of_fkey foreign key (duplicate_of) references public.riders (id) on delete restrict;

create or replace function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text, p_birthdate date, p_terms_version text
) returns table (rider_id uuid, already_registered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := private.norm_phone(p_phone);
  v_phone2 text := private.norm_phone(p_phone2);
  v_key text := coalesce(nullif(private.norm_phone(p_phone), ''), lower(btrim(coalesce(p_email, ''))));
  v_match uuid;
  v_id uuid;
begin
  if char_length(coalesce(p_terms_version, '')) not between 1 and 40 then
    raise exception 'Terms version is not valid' using errcode = '23514', hint = 'terms_invalid';
  end if;
  if p_birthdate is not null and (p_birthdate < date '1900-01-01' or p_birthdate > current_date) then
    raise exception 'Birth date is not valid' using errcode = '23514', hint = 'birthdate_invalid';
  end if;
  if v_email = '' and length(v_phone) < 8 then
    raise exception 'Contact details are not valid' using errcode = '23514', hint = 'contact_invalid';
  end if;

  -- Same lock as private.find_or_create_rider, one for phone2 as an order key, then the throttle's per-contact locks.
  perform pg_advisory_xact_lock(hashtext('rider:' || v_key));
  if v_phone2 <> '' and v_phone2 <> v_phone then
    perform pg_advisory_xact_lock(hashtext('rider:' || v_phone2));
  end if;
  if v_email <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:e:' || v_email));
  end if;
  if v_phone <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone));
  end if;

  -- Any submitted contact that belongs to an existing customer makes this a duplicate of that customer.
  v_match := coalesce(private.find_rider(p_phone, p_email), private.find_rider(p_phone2, null));

  -- Already registered (photo and signed rules): nothing to store. The id stays here; the caller gets only the flag.
  if v_match is not null and exists (
    select 1 from public.riders r
     where r.id = v_match and r.avatar_path is not null
       and exists (select 1 from public.rider_waivers w where w.rider_id = r.id and w.signature_path is not null)
  ) then
    return query select null::uuid, true;
    return;
  end if;

  -- Unfinished self-registrations (no photo yet) per contact in 24 h.
  if (
    select count(*) from public.riders r
     where r.self_registered and r.avatar_path is null
       and r.created_at > now() - interval '24 hours'
       and ((v_email <> '' and lower(btrim(coalesce(r.email, ''))) = v_email)
         or (v_phone <> '' and private.norm_phone(r.phone) = v_phone))
  ) >= 3 then
    raise exception 'Too many registrations for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;

  -- Park-wide ceiling: far above a busy event day, far below a flood.
  if (
    select count(*) from public.riders r
     where r.self_registered and r.created_at > now() - interval '1 hour'
  ) >= 100 then
    raise exception 'Too many registrations right now' using errcode = '54000', hint = 'too_many_registrations';
  end if;

  -- Always a new row. When a contact belongs to an existing customer, it is marked for staff to merge.
  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered, duplicate_of)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true, v_match)
  returning id into v_id;
  insert into public.rider_waivers (rider_id, terms_version) values (v_id, p_terms_version);
  return query select v_id, false;
end;
$$;
revoke all on function public.register_rider_public(text, text, text, text, text, date, text) from public;
grant execute on function public.register_rider_public(text, text, text, text, text, date, text) to anon;
