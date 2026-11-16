-- ADR-0106, second review follow-up. `duplicate_of ... on delete restrict` (20261116182546) let an anonymous caller
-- veto staff deleting ANY customer (an erasure request, say): register with that customer's phone and the original
-- becomes undeletable. The quarantine now lives in its own flag instead of in the foreign key:
--   * `riders.needs_review` (default false) is set by /registracija when a submitted contact matched an existing
--     customer, and only staff clear it. private.find_rider and my_riders() skip rows that need review;
--   * `duplicate_of` is back to `on delete set null`: it only says which customer was matched, so deleting the
--     original never blocks and never promotes the duplicate;
--   * the per-contact throttle also counts the second phone, in both directions.

alter table public.riders add column needs_review boolean not null default false;
update public.riders set needs_review = true where duplicate_of is not null;

comment on column public.riders.needs_review is
  'Created by /registracija with a phone or e-mail that already belonged to another customer. Unverified: skipped by order linking and customer accounts until staff check it (ADR-0106).';
comment on column public.riders.duplicate_of is
  'The customer whose phone or e-mail this /registracija row reused, if any. Informational; the quarantine is needs_review (ADR-0106).';

alter table public.riders drop constraint riders_duplicate_of_fkey;
alter table public.riders
  add constraint riders_duplicate_of_fkey foreign key (duplicate_of) references public.riders (id) on delete set null;

drop index public.riders_duplicate_of_idx;
create index riders_needs_review_idx on public.riders (duplicate_of) where needs_review;

create or replace function private.find_rider(p_phone text, p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
    from public.riders r
   where not r.needs_review
     and ((private.norm_phone(p_phone) <> ''
           and (private.norm_phone(r.phone) = private.norm_phone(p_phone) or private.norm_phone(r.phone2) = private.norm_phone(p_phone)))
       or (nullif(btrim(coalesce(p_email, '')), '') is not null and lower(btrim(r.email)) = lower(btrim(p_email))))
   order by (r.avatar_path is not null) desc, r.created_at
   limit 1;
$$;
revoke execute on function private.find_rider(text, text) from public, anon, authenticated;

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
  if v_phone2 <> '' and v_phone2 <> v_phone then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone2));
  end if;

  -- Any submitted contact that belongs to an existing customer makes this row one for staff to review.
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

  -- Park-wide ceiling: far above a busy event day, far below a flood.
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

-- my_riders(): unchanged except that rows waiting for review are left out.
create or replace function public.my_riders()
returns table (
  id uuid, name text, surname text, plan_name text, plan_description text, plan_category text, plan_price numeric,
  cards text[], purchases jsonb, registered boolean, email text, phone text, phone2 text, birthdate date,
  avatar_path text, signed_at timestamptz, terms_version text, primary_match boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.name, r.surname,
         p.name, p.description, p.category, p.price,
         coalesce((select array_agg(c.card_number order by c.bound_at) from public.rider_cards c where c.rider_id = r.id), '{}'),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'planName', x.plan_name, 'category', x.plan_category, 'price', x.price, 'soldAt', x.sold_at
                  ) order by x.sold_at desc)
           from public.purchases x where x.rider_id = r.id
         ), '[]'::jsonb),
         (r.avatar_path is not null and w.id is not null),
         case when m.is_primary then r.email end,
         case when m.is_primary then r.phone end,
         case when m.is_primary then r.phone2 end,
         case when m.is_primary then r.birthdate end,
         case when m.is_primary then r.avatar_path end,
         case when m.is_primary then w.signed_at end,
         case when m.is_primary then w.terms_version end,
         m.is_primary
  from public.riders r
  left join public.ride_plans p on p.id = r.plan_id
  left join lateral (
    select x.id, x.signed_at, x.terms_version
      from public.rider_waivers x
     where x.rider_id = r.id and x.signature_path is not null
     order by x.signed_at desc
     limit 1
  ) w on true
  join auth.users u on u.id = (select auth.uid())
  cross join lateral (select regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') as account_phone) a
  cross join lateral (
    select
      coalesce(u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email), false) as email_match,
      coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9
               and a.account_phone = private.normalize_phone(r.phone), false) as phone_match,
      coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9
               and a.account_phone = private.normalize_phone(r.phone2), false) as phone2_match
  ) q
  cross join lateral (select (q.email_match or q.phone_match) as is_primary) m
  where not r.needs_review
    and (q.email_match or q.phone_match or q.phone2_match)
  order by r.created_at;
$$;
revoke execute on function public.my_riders() from public, anon;
grant execute on function public.my_riders() to authenticated;
