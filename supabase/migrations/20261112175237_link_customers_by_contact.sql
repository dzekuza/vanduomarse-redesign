-- One customer per phone number or e-mail (ADR-0083).
-- Until now an order was tied to a customer (`rider_id`) only by a one-time backfill (7 Nov), and /registracija always
-- inserted a NEW rider, so the same person became several customers. Now:
--   * every new booking, quad rental, event ticket and coupon is linked, on insert, to the existing customer with the same
--     phone (phone or phone2, `private.norm_phone`) or e-mail, and a customer is created only when none matches;
--   * the existing unlinked orders are linked the same way;
--   * public registration reuses the matching customer instead of inserting another one.
-- When several customers match, the one who finished registering (has a photo) wins, then the oldest.

-- Fast lookup by the same expressions the match uses.
create index riders_norm_phone_idx on public.riders (private.norm_phone(phone));
create index riders_norm_phone2_idx on public.riders (private.norm_phone(phone2));
create index riders_email_norm_idx on public.riders (lower(btrim(email)));

-- The customer with this phone or e-mail (a registered one first, then the oldest), or null.
create function private.find_rider(p_phone text, p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
    from public.riders r
   where (private.norm_phone(p_phone) <> ''
          and (private.norm_phone(r.phone) = private.norm_phone(p_phone) or private.norm_phone(r.phone2) = private.norm_phone(p_phone)))
      or (nullif(btrim(coalesce(p_email, '')), '') is not null and lower(btrim(r.email)) = lower(btrim(p_email)))
   order by (r.avatar_path is not null) desc, r.created_at
   limit 1;
$$;

-- The matching customer, or a new one from the order's contact (the name split like the backfill did). Null when the
-- contact has neither a phone nor an e-mail. An advisory lock per contact stops two simultaneous orders creating two.
create function private.find_or_create_rider(p_name text, p_phone text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_key text := coalesce(nullif(private.norm_phone(p_phone), ''), lower(btrim(coalesce(p_email, ''))));
  v_name text := btrim(coalesce(p_name, ''));
  v_first text := split_part(btrim(coalesce(p_name, '')), ' ', 1);
begin
  if v_key = '' then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtext('rider:' || v_key));
  v_id := private.find_rider(p_phone, p_email);
  if v_id is not null then
    return v_id;
  end if;
  insert into public.riders (name, surname, phone, email)
  values (
    left(coalesce(nullif(v_first, ''), 'Klientas'), 60),
    left(coalesce(nullif(btrim(substr(v_name, length(v_first) + 1)), ''), '-'), 60),
    left(nullif(btrim(coalesce(p_phone, '')), ''), 30),
    left(nullif(btrim(coalesce(p_email, '')), ''), 120)
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- BEFORE INSERT triggers: link the order to its customer when the insert did not already.
create function private.link_order_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rider_id is null then
    new.rider_id := private.find_or_create_rider(new.customer_name, new.customer_phone, new.customer_email);
  end if;
  return new;
end;
$$;

create function private.link_coupon_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rider_id is null then
    new.rider_id := private.find_or_create_rider(new.buyer_name, new.buyer_phone, new.buyer_email);
  end if;
  return new;
end;
$$;

create trigger bookings_link_customer before insert on public.bookings for each row execute function private.link_order_customer();
create trigger quad_rentals_link_customer before insert on public.quad_rentals for each row execute function private.link_order_customer();
create trigger event_tickets_link_customer before insert on public.event_tickets for each row execute function private.link_order_customer();
create trigger coupons_link_customer before insert on public.coupons for each row execute function private.link_coupon_customer();

revoke execute on function private.find_rider(text, text) from public, anon, authenticated;
revoke execute on function private.find_or_create_rider(text, text, text) from public, anon, authenticated;
revoke execute on function private.link_order_customer() from public, anon, authenticated;
revoke execute on function private.link_coupon_customer() from public, anon, authenticated;

-- Link the orders that were never linked to an EXISTING customer (12 of 18 at the time of writing). The rest have a contact
-- with no customer yet (test e-mails and one coupon buyer): no customer is created for them here, the next order from that
-- contact creates it.
update public.bookings set rider_id = private.find_rider(customer_phone, customer_email) where rider_id is null;
update public.quad_rentals set rider_id = private.find_rider(customer_phone, customer_email) where rider_id is null;
update public.event_tickets set rider_id = private.find_rider(customer_phone, customer_email) where rider_id is null;
update public.coupons set rider_id = private.find_rider(buyer_phone, buyer_email) where rider_id is null;

-- Public registration reuses the matching customer. It fills blanks only and never overwrites what is stored (the phone
-- and e-mail are not verified here), and a customer who already finished registering (photo and signed rules) is
-- returned as `already_registered`, so the caller skips the uploads (their storage policies would refuse them anyway).
drop function public.register_rider_public(text, text, text, text, text, date, text);

create function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text, p_birthdate date, p_terms_version text
) returns table (rider_id uuid, already_registered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_key text := coalesce(nullif(private.norm_phone(p_phone), ''), lower(btrim(coalesce(p_email, ''))));
  r public.riders;
begin
  if v_key <> '' then
    perform pg_advisory_xact_lock(hashtext('rider:' || v_key));
    v_id := private.find_rider(p_phone, p_email);
  end if;

  if v_id is not null then
    select * into r from public.riders x where x.id = v_id for update;
    if r.avatar_path is not null and exists (select 1 from public.rider_waivers w where w.rider_id = r.id and w.signature_path is not null) then
      return query select r.id, true;
      return;
    end if;
    update public.riders x
       set phone = coalesce(nullif(x.phone, ''), nullif(p_phone, '')),
           phone2 = coalesce(nullif(x.phone2, ''), nullif(p_phone2, '')),
           email = coalesce(nullif(x.email, ''), nullif(p_email, '')),
           birthdate = coalesce(x.birthdate, p_birthdate),
           self_registered = true
     where x.id = v_id;
    insert into public.rider_waivers (rider_id, terms_version) values (v_id, p_terms_version);
    return query select v_id, false;
    return;
  end if;

  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true)
  returning id into v_id;
  insert into public.rider_waivers (rider_id, terms_version) values (v_id, p_terms_version);
  return query select v_id, false;
end;
$$;
revoke all on function public.register_rider_public(text, text, text, text, text, date, text) from public;
grant execute on function public.register_rider_public(text, text, text, text, text, date, text) to anon;

-- A plan order is created by the server for the rider id it was just given (never a client-supplied one), and that rider
-- may now be an existing customer, so the `self_registered` requirement goes.
create or replace function public.create_plan_order(p_rider_id uuid, p_plan_id uuid)
returns table (id uuid, reference text, plan_name text, price numeric, rider_name text, rider_email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.ride_plans;
  v_rider public.riders;
  v_ref text;
  v_id uuid;
begin
  select * into v_plan from public.ride_plans p
   where p.id = p_plan_id and p.active and p.sold_online and p.price is not null and p.price > 0;
  if not found then
    raise exception 'Plan is not sold online' using errcode = '23514', hint = 'plan_unavailable';
  end if;
  select * into v_rider from public.riders r where r.id = p_rider_id;
  if not found then
    raise exception 'Unknown rider' using errcode = '23514', hint = 'rider_unknown';
  end if;
  loop
    v_ref := 'AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.rider_plan_orders o where o.reference = v_ref);
  end loop;
  insert into public.rider_plan_orders (reference, rider_id, plan_id, plan_name, plan_category, price)
  values (v_ref, v_rider.id, v_plan.id, v_plan.name, v_plan.category, v_plan.price)
  returning rider_plan_orders.id into v_id;
  return query select v_id, v_ref, v_plan.name, v_plan.price, (v_rider.name || ' ' || v_rider.surname), coalesce(v_rider.email, '');
end;
$$;
