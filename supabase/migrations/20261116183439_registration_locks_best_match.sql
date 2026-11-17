-- ADR-0107 (the earlier registration migrations call it ADR-0106), PR review follow-up on register_rider_public:
-- 1. Locks: every advisory lock is now taken in one canonical order (sorted by key hash), so two registrations that
--    swap the same phone and phone2 cannot deadlock. The e-mail's `rider:` key is locked too, so a phone-plus-e-mail
--    registration also serialises with an e-mail-only order in private.find_or_create_rider.
-- 2. The park-wide hourly cap takes a shared lock, so concurrent registrations from different contacts cannot all see a
--    count under the cap and overshoot it.
-- 3. Each submitted contact is matched on its own, and a fully registered match wins over an unfinished one, so a
--    registered customer reached through phone2 is still answered `already_registered` with no id.
-- Column comments now name ADR-0107.

comment on column public.riders.needs_review is
  'Created by /registracija with a phone or e-mail that already belonged to another customer. Unverified: skipped by order linking and customer accounts until staff check it (ADR-0107).';
comment on column public.riders.duplicate_of is
  'The customer whose phone or e-mail this /registracija row reused, if any. Informational; the quarantine is needs_review (ADR-0107).';

create or replace function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text, p_birthdate date, p_terms_version text
) returns table (rider_id uuid, already_registered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := private.norm_phone(coalesce(p_phone, ''));
  v_phone2 text := private.norm_phone(coalesce(p_phone2, ''));
  v_lock int;
  v_match uuid;
  v_match_registered boolean := false;
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

  -- `rider:<key>` is the key private.find_or_create_rider locks; `contact:*` serialise the per-contact throttle;
  -- the last one serialises the park-wide cap. All in one sorted order, so no two callers wait on each other in a cycle.
  for v_lock in
    select distinct hashtext(k)
      from unnest(array[
        case when v_phone <> '' then 'rider:' || v_phone end,
        case when v_phone2 <> '' then 'rider:' || v_phone2 end,
        case when v_email <> '' then 'rider:' || v_email end,
        case when v_email <> '' then 'contact:e:' || v_email end,
        case when v_phone <> '' then 'contact:p:' || v_phone end,
        case when v_phone2 <> '' then 'contact:p:' || v_phone2 end,
        'register_rider_public:global'
      ]) as k
     where k is not null
     order by 1
  loop
    perform pg_advisory_xact_lock(v_lock);
  end loop;

  -- The existing customer behind any submitted contact; a fully registered one first, then phone, e-mail, phone2.
  select c.id, c.registered into v_match, v_match_registered
    from (
      select x.prio, x.id,
             exists (
               select 1 from public.riders r
                where r.id = x.id and r.avatar_path is not null
                  and exists (select 1 from public.rider_waivers w where w.rider_id = r.id and w.signature_path is not null)
             ) as registered
        from (values
          (1, private.find_rider(p_phone, '')),
          (2, private.find_rider('', p_email)),
          (3, private.find_rider(p_phone2, ''))
        ) as x(prio, id)
       where x.id is not null
    ) c
   order by c.registered desc, c.prio
   limit 1;

  -- Already registered (photo and signed rules): nothing to store. The id stays here; the caller gets only the flag.
  if v_match_registered then
    return query select null::uuid, true;
    return;
  end if;

  -- Unfinished self-registrations (no photo yet) per contact in 24 h; either phone counts on either side.
  if (
    select count(*) from public.riders r
     where r.self_registered and r.avatar_path is null
       and r.created_at > now() - interval '24 hours'
       and ((v_email <> '' and lower(btrim(coalesce(r.email, ''))) = v_email)
         or (v_phone <> '' and v_phone in (private.norm_phone(r.phone), private.norm_phone(r.phone2)))
         or (v_phone2 <> '' and v_phone2 in (private.norm_phone(r.phone), private.norm_phone(r.phone2))))
  ) >= 3 then
    raise exception 'Too many registrations for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;

  -- Park-wide ceiling: far above a busy event day, far below a flood (held under the global lock above).
  if (
    select count(*) from public.riders r
     where r.self_registered and r.created_at > now() - interval '1 hour'
  ) >= 100 then
    raise exception 'Too many registrations right now' using errcode = '54000', hint = 'too_many_registrations';
  end if;

  -- Always a new row. When a contact belongs to an existing customer, it waits for staff review.
  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered, duplicate_of, needs_review)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true,
          v_match, v_match is not null)
  returning id into v_id;
  insert into public.rider_waivers (rider_id, terms_version) values (v_id, p_terms_version);
  return query select v_id, false;
end;
$$;
revoke all on function public.register_rider_public(text, text, text, text, text, date, text) from public;
grant execute on function public.register_rider_public(text, text, text, text, text, date, text) to anon;
