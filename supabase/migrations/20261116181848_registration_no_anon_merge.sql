-- Public registration no longer writes onto an existing customer (ADR-0106, supersedes the registration part of ADR-0083).
-- register_rider_public is granted to anon and nothing it receives is verified, so anyone who knew a customer's phone or
-- e-mail could fill that customer's blank e-mail/phone/phone2 with their own (after which my_riders() showed the
-- customer's plan data to the caller's account), mark them self_registered, add a waiver, and get the existing rider id
-- back for the photo/signature finalize and create_plan_order. Now:
--   * a registration whose phone or e-mail matches an existing customer creates a NEW customer row, marked
--     `duplicate_of` = the matched one, and leaves the existing row untouched; staff merge the two;
--   * a row marked `duplicate_of` is never picked by private.find_rider (so new orders keep linking to the original
--     customer) and never shown by my_riders() (so it cannot reach someone's account before staff have checked it);
--   * a customer who already finished registering is still answered `already_registered`, but WITHOUT the rider id;
--   * the validation and throttles from 20261111174736 (dropped by 20261113230000) are back.

alter table public.riders
  add column duplicate_of uuid references public.riders (id) on delete set null;

comment on column public.riders.duplicate_of is
  'Set when /registracija received a phone or e-mail that already belongs to this other customer. Unverified: staff check and merge (ADR-0106).';

create index riders_duplicate_of_idx on public.riders (duplicate_of) where duplicate_of is not null;

-- The original customer with this phone or e-mail (a registered one first, then the oldest), or null. Unchecked
-- duplicates from /registracija are skipped.
create or replace function private.find_rider(p_phone text, p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
    from public.riders r
   where r.duplicate_of is null
     and ((private.norm_phone(p_phone) <> ''
           and (private.norm_phone(r.phone) = private.norm_phone(p_phone) or private.norm_phone(r.phone2) = private.norm_phone(p_phone)))
       or (nullif(btrim(coalesce(p_email, '')), '') is not null and lower(btrim(r.email)) = lower(btrim(p_email))))
   order by (r.avatar_path is not null) desc, r.created_at
   limit 1;
$$;
revoke execute on function private.find_rider(text, text) from public, anon, authenticated;

drop function public.register_rider_public(text, text, text, text, text, date, text);

create function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text, p_birthdate date, p_terms_version text
) returns table (rider_id uuid, already_registered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := private.norm_phone(p_phone);
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

  -- Same lock as private.find_or_create_rider, then the per-contact locks the throttle needs.
  perform pg_advisory_xact_lock(hashtext('rider:' || v_key));
  if v_email <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:e:' || v_email));
  end if;
  if v_phone <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone));
  end if;

  v_match := private.find_rider(p_phone, p_email);

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

  -- Always a new row. When the contact belongs to an existing customer, it is marked for staff to merge.
  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered, duplicate_of)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true, v_match)
  returning id into v_id;
  insert into public.rider_waivers (rider_id, terms_version) values (v_id, p_terms_version);
  return query select v_id, false;
end;
$$;
revoke all on function public.register_rider_public(text, text, text, text, text, date, text) from public;
grant execute on function public.register_rider_public(text, text, text, text, text, date, text) to anon;

-- my_riders(): unchanged except that unchecked duplicates are left out.
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
  where r.duplicate_of is null
    and (q.email_match or q.phone_match or q.phone2_match)
  order by r.created_at;
$$;
revoke execute on function public.my_riders() from public, anon;
grant execute on function public.my_riders() to authenticated;
