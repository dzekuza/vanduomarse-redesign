-- WAKE season passes are bracelet plans bought online (ADR-0076).
-- A visitor registers (rider row, photo, signed rules), pays with Stripe Checkout, and the webhook attaches the
-- plan to that rider and logs a purchase. Staff bind the physical bracelet at the park as before.
-- Orders are service-role only (the checkout action and the webhook); anon/authenticated cannot touch them.

-- Plans that may be sold online; the public site lists only these (prices stay in ride_plans).
alter table public.ride_plans add column sold_online boolean not null default false;

insert into public.ride_plans (name, description, price, category, sold_online, sort_order)
select v.name, v.description, v.price, 'Abonementai', true, v.sort_order
from (values
  ('WAKE sezono abonementas', 'Plaukimas kabeline trasa visą sezoną.', 750.00, 0),
  ('WAKE sezono abonementas + pirtis', 'Plaukimas kabeline trasa ir neriboti apsilankymai pirtyje visą sezoną.', 950.00, 1)
) as v(name, description, price, sort_order)
where not exists (select 1 from public.ride_plans p where p.name = v.name and p.category = 'Abonementai');

-- The season passes are no longer coupon products.
update public.coupon_products set active = false where id in ('wake-abonementas-sezonas', 'wake-abonementas-sezonas-pirtis');

-- Public read of the plans on sale online. Nothing else of ride_plans is exposed.
create function public.online_plans()
returns table (id uuid, name text, description text, price numeric, category text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.description, p.price, p.category
    from public.ride_plans p
   where p.active and p.sold_online and p.price is not null and p.price > 0
   order by p.sort_order, p.name;
$$;
revoke execute on function public.online_plans() from public;
grant execute on function public.online_plans() to anon, authenticated, service_role;

create table public.rider_plan_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  rider_id uuid not null references public.riders(id) on delete cascade,
  plan_id uuid references public.ride_plans(id) on delete set null,
  plan_name text not null,
  plan_category text not null,
  price numeric(10, 2) not null check (price > 0),
  status text not null default 'laukia_apmokejimo' check (status in ('laukia_apmokejimo', 'apmoketa', 'atsauktas')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  purchase_id uuid references public.purchases(id) on delete set null,
  created_at timestamptz not null default now()
);
create index rider_plan_orders_rider_idx on public.rider_plan_orders (rider_id);
create index rider_plan_orders_intent_idx on public.rider_plan_orders (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

alter table public.rider_plan_orders enable row level security;
revoke all on public.rider_plan_orders from anon, authenticated;
grant select on public.rider_plan_orders to authenticated;
create policy "apyrankes plan orders read" on public.rider_plan_orders
  for select to authenticated using ((select private.has_permission('apyrankes')));

-- A new unpaid order for a rider the registration just created.
create function public.create_plan_order(p_rider_id uuid, p_plan_id uuid)
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
  select * into v_rider from public.riders r where r.id = p_rider_id and r.self_registered;
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

create function public.attach_plan_order_session(p_order_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rider_plan_orders set stripe_session_id = p_session_id
   where id = p_order_id and status = 'laukia_apmokejimo';
  if not found then
    raise exception 'Order is not awaiting payment' using errcode = '23514', hint = 'order_not_pending';
  end if;
end;
$$;

-- Checkout could not open: drop the unpaid order.
create function public.abandon_plan_order(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.rider_plan_orders set status = 'atsauktas' where id = p_order_id and status = 'laukia_apmokejimo';
$$;

-- The webhook calls this when Stripe says the session is paid. Attaches the plan to the rider and logs the purchase
-- once; safe to repeat (only the first call reports newly_paid). A paid amount that differs from the price changes nothing
-- and reports amount_ok = false so staff can check it.
create function public.complete_plan_order_payment(p_order_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
returns table (
  newly_paid boolean, amount_ok boolean, order_status text, reference text, rider_id uuid, rider_name text, rider_email text,
  plan_name text, price numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.rider_plan_orders;
  r public.riders;
  v_purchase uuid;
  v_new boolean := false;
begin
  select * into o from public.rider_plan_orders x where x.id = p_order_id for update;
  if not found then
    return;
  end if;

  if o.status = 'laukia_apmokejimo' and p_amount = o.price then
    insert into public.purchases (rider_id, plan_id, plan_name, plan_category, price, sold_by)
    values (o.rider_id, o.plan_id, o.plan_name, o.plan_category, o.price, null)
    returning purchases.id into v_purchase;
    if o.plan_id is not null then
      update public.riders set plan_id = o.plan_id where riders.id = o.rider_id;
    end if;
    update public.rider_plan_orders
       set status = 'apmoketa', paid_at = now(), purchase_id = v_purchase,
           stripe_session_id = coalesce(p_session_id, stripe_session_id), stripe_payment_intent_id = p_payment_intent
     where rider_plan_orders.id = p_order_id
    returning * into o;
    v_new := true;
  end if;

  select * into r from public.riders where riders.id = o.rider_id;
  return query select v_new, (p_amount = o.price), o.status, o.reference, o.rider_id,
    (r.name || ' ' || r.surname), coalesce(r.email, ''), o.plan_name, o.price;
end;
$$;

-- The Checkout Session expired unpaid: the order is cancelled.
create function public.expire_plan_order_session(p_session_id text)
returns integer
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.rider_plan_orders set status = 'atsauktas'
     where stripe_session_id = p_session_id and status = 'laukia_apmokejimo'
    returning 1
  )
  select count(*)::integer from u;
$$;

-- A full refund cancels the order (the rider's plan is left for staff to change). Returns the reference for the staff alert.
create function public.refund_plan_order_payment(p_payment_intent text, p_refunded numeric)
returns text
language sql
security definer
set search_path = ''
as $$
  update public.rider_plan_orders set status = 'atsauktas'
   where stripe_payment_intent_id = p_payment_intent and status = 'apmoketa' and p_refunded >= price
  returning reference;
$$;

-- What the return page shows; the Checkout Session id in the URL is unguessable.
create function public.plan_order_state(p_session_id text)
returns table (status text, reference text, plan_name text, price numeric, rider_email text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.status, o.reference, o.plan_name, o.price, coalesce(r.email, '')
    from public.rider_plan_orders o join public.riders r on r.id = o.rider_id
   where o.stripe_session_id = p_session_id;
$$;

revoke execute on function public.create_plan_order(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.attach_plan_order_session(uuid, text) from public, anon, authenticated;
revoke execute on function public.abandon_plan_order(uuid) from public, anon, authenticated;
revoke execute on function public.complete_plan_order_payment(uuid, text, text, numeric) from public, anon, authenticated;
revoke execute on function public.expire_plan_order_session(text) from public, anon, authenticated;
revoke execute on function public.refund_plan_order_payment(text, numeric) from public, anon, authenticated;
revoke execute on function public.plan_order_state(text) from public, anon, authenticated;
grant execute on function public.create_plan_order(uuid, uuid) to service_role;
grant execute on function public.attach_plan_order_session(uuid, text) to service_role;
grant execute on function public.abandon_plan_order(uuid) to service_role;
grant execute on function public.complete_plan_order_payment(uuid, text, text, numeric) to service_role;
grant execute on function public.expire_plan_order_session(text) to service_role;
grant execute on function public.refund_plan_order_payment(text, numeric) to service_role;
grant execute on function public.plan_order_state(text) to service_role;
