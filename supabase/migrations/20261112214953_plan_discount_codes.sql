-- Discount codes (ADR-0036) also work on bracelet plans bought online (WAKE passes, swim tickets): service 'planai'.
-- The order's `price` is what the buyer pays (plan price minus the discount); the webhook amount check, the purchase
-- row and the refund check all read it, so they follow the discounted amount. The discount is priced here, never taken
-- from the client, and totals under 0,50 EUR are refused (Stripe's minimum).

do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.discount_codes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kuponai%';
  if c is not null then
    execute format('alter table public.discount_codes drop constraint %I', c);
  end if;
end $$;

alter table public.discount_codes add constraint discount_codes_services_check
  check (cardinality(services) > 0 and services <@ array['pirtis', 'nakvyne', 'keturraciai', 'kuponai', 'planai']);

alter table public.rider_plan_orders
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);
create index rider_plan_orders_discount_idx on public.rider_plan_orders (discount_code_id) where discount_code_id is not null;

create or replace function private.discount_code_uses(p_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select ((select count(*) from public.bookings b where b.discount_code_id = p_id and b.status <> 'atsaukta')
        + (select count(*) from public.quad_rentals q where q.discount_code_id = p_id and q.status <> 'atsaukta')
        + (select count(*) from public.event_tickets t where t.discount_code_id = p_id and t.status <> 'atsaukta')
        + (select count(*) from public.coupons c where c.discount_code_id = p_id and c.status <> 'atsauktas')
        + (select count(*) from public.rider_plan_orders o where o.discount_code_id = p_id and o.status <> 'atsauktas'))::integer;
$$;

create or replace function public.discount_code_usage()
returns table (code_id uuid, uses integer, discount_total numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('nuolaidos') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select d.id, private.discount_code_uses(d.id),
           coalesce((select sum(r.amount) from (
              select b.discount_amount as amount from public.bookings b where b.discount_code_id = d.id and b.status <> 'atsaukta'
              union all
              select q.discount_amount from public.quad_rentals q where q.discount_code_id = d.id and q.status <> 'atsaukta'
              union all
              select t.discount_amount from public.event_tickets t where t.discount_code_id = d.id and t.status <> 'atsaukta'
              union all
              select c.discount_amount from public.coupons c where c.discount_code_id = d.id and c.status <> 'atsauktas'
              union all
              select o.discount_amount from public.rider_plan_orders o where o.discount_code_id = d.id and o.status <> 'atsauktas'
            ) r), 0)
    from public.discount_codes d;
end;
$$;

drop function public.create_plan_order(uuid, uuid);

create function public.create_plan_order(p_rider_id uuid, p_plan_id uuid, p_discount_code text default null)
-- price: what the buyer pays.
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
  dc record;
  v_discount numeric := 0;
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

  select a.code_id, a.code, a.amount into dc from private.apply_discount_code(p_discount_code, 'planai', v_plan.price) a;
  if dc.code_id is not null then
    v_discount := dc.amount;
    if v_plan.price - v_discount < 0.5 then
      raise exception 'Total below the minimum' using errcode = '23514', hint = 'below_minimum';
    end if;
  end if;

  loop
    v_ref := 'AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.rider_plan_orders o where o.reference = v_ref);
  end loop;
  insert into public.rider_plan_orders (reference, rider_id, plan_id, plan_name, plan_category, price, discount_code_id, discount_code, discount_amount)
  values (v_ref, v_rider.id, v_plan.id, v_plan.name, v_plan.category, v_plan.price - v_discount, dc.code_id, dc.code, v_discount)
  returning rider_plan_orders.id into v_id;
  return query select v_id, v_ref, v_plan.name, v_plan.price - v_discount, (v_rider.name || ' ' || v_rider.surname), coalesce(v_rider.email, '');
end;
$$;

revoke execute on function public.create_plan_order(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_plan_order(uuid, uuid, text) to service_role;
