-- Vanduo Marse: harden the per-contact caps from 20261028150024.
-- Phones are compared in one canonical form (+370 / 8 / 00370 / bare 8 digits
-- all match), web requests need a real email or a phone with 8+ digits, and
-- concurrent requests from one contact are serialised so the cap cannot be raced.

-- Canonical phone digits: strips formatting, a leading 00, and turns a national 8xxxxxxxx / 6xxxxxxx into 370xxxxxxxx.
create function private.norm_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  with d as (select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as v),
       s as (select case when v like '00%' then substr(v, 3) else v end as v from d)
  select case
    when v like '370%' then v
    when v like '8%' and length(v) = 9 then '370' || substr(v, 2)
    when length(v) = 8 then '370' || v
    else v
  end
  from s;
$$;

create or replace function private.pending_web_requests(p_email text, p_phone text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with contact as (
    select lower(btrim(coalesce(p_email, ''))) as email, private.norm_phone(p_phone) as phone
  ), pending as (
    select customer_email, customer_phone from public.bookings where status = 'laukia' and source = 'svetaine'
    union all
    select customer_email, customer_phone from public.event_tickets where status = 'laukia' and source = 'svetaine'
    union all
    select customer_email, customer_phone from public.quad_rentals where status = 'laukia' and source = 'svetaine'
  )
  select count(*)::integer
  from pending p, contact c
  where (c.email <> '' and lower(btrim(coalesce(p.customer_email, ''))) = c.email)
     or (c.phone <> '' and private.norm_phone(p.customer_phone) = c.phone);
$$;

create or replace function public.limit_pending_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(new.customer_email, '')));
  v_phone text := private.norm_phone(new.customer_phone);
begin
  if new.status <> 'laukia' or new.source <> 'svetaine' then
    return new;
  end if;

  -- A web request needs a real email or a phone with at least 8 digits.
  if v_email = '' and length(v_phone) < 8 then
    raise exception 'Contact details are not valid' using errcode = '23514', hint = 'contact_invalid';
  end if;

  -- Serialise concurrent requests from the same contact so the cap cannot be raced.
  if v_email <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:e:' || v_email));
  end if;
  if v_phone <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone));
  end if;

  if private.pending_web_requests(v_email, v_phone) >= 3 then
    raise exception 'Too many pending requests for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;
  return new;
end;
$$;

create or replace function public.limit_new_inquiries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(new.customer_email, '')));
  v_phone text := private.norm_phone(new.customer_phone);
begin
  if new.status <> 'nauja' then
    return new;
  end if;

  if v_email = '' and length(v_phone) < 8 then
    raise exception 'Contact details are not valid' using errcode = '23514', hint = 'contact_invalid';
  end if;

  if v_email <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:e:' || v_email));
  end if;
  if v_phone <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone));
  end if;

  if (
    select count(*) from public.inquiries q
     where q.status = 'nauja' and q.created_at > now() - interval '24 hours'
       and ((v_email <> '' and lower(btrim(coalesce(q.customer_email, ''))) = v_email)
         or (v_phone <> '' and private.norm_phone(q.customer_phone) = v_phone))
  ) >= 5 then
    raise exception 'Too many inquiries for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;
  return new;
end;
$$;

revoke execute on function private.norm_phone(text) from public, anon, authenticated;
