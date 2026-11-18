-- Points / kreditai, phase 1 (ADR-0121): a balance per customer (rider), earned from paid online
-- reservations and plan orders or granted by staff, with a full ledger. Spending at checkout is phase 2.
--
-- The balance hangs off public.riders (Klientai), the one customer anchor: an account is matched to its riders by
-- confirmed contact at read time (my_riders), so a customer who signs in by phone one day and e-mail the next
-- keeps one balance. Every change goes through private.apply_points, which locks, checks and writes the ledger
-- row and the balance together.

-- ---------------------------------------------------------------------------
-- Settings: one row, owners edit, everybody can read (the earn rate is not secret).
-- ---------------------------------------------------------------------------

create table public.loyalty_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  -- Points a customer earns for each euro actually paid online.
  earn_points_per_euro numeric(8, 2) not null default 5 check (earn_points_per_euro >= 0 and earn_points_per_euro <= 1000),
  -- What one point is worth at checkout, in euros (phase 2).
  point_value_eur numeric(8, 4) not null default 0.01 check (point_value_eur > 0 and point_value_eur <= 100),
  updated_at timestamptz not null default now()
);

insert into public.loyalty_settings (id) values (true);

create trigger loyalty_settings_updated_at before update on public.loyalty_settings
  for each row execute function public.set_updated_at();

comment on table public.loyalty_settings is
  'Single-row points settings: on/off, points earned per euro paid, euro value of one point. Owners write; readable by all.';

alter table public.loyalty_settings enable row level security;
create policy "anyone reads loyalty settings" on public.loyalty_settings
  for select to anon, authenticated using (true);
create policy "owner updates loyalty settings" on public.loyalty_settings
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));

revoke all on public.loyalty_settings from anon, authenticated;
grant select on public.loyalty_settings to anon, authenticated;
grant update (enabled, earn_points_per_euro, point_value_eur) on public.loyalty_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Balance and ledger
-- ---------------------------------------------------------------------------

alter table public.riders add column points_balance integer not null default 0 check (points_balance >= 0);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  -- Positive adds points, negative takes them away.
  delta integer not null check (delta <> 0),
  kind text not null check (kind in ('earn', 'admin', 'redeem', 'release', 'clawback', 'return')),
  reason text not null default '' check (char_length(reason) <= 200),
  -- What caused it (payment, plan_order, ...), so the same event never credits twice.
  source_kind text,
  source_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

create index points_ledger_rider_idx on public.points_ledger (rider_id, created_at desc);
create unique index points_ledger_source_idx on public.points_ledger (source_kind, source_id, kind) where source_id is not null;

alter table public.points_ledger enable row level security;
create policy "staff read points ledger" on public.points_ledger
  for select to authenticated using ((select private.has_permission('klientai')));

revoke all on public.points_ledger from anon, authenticated;
grant select on public.points_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- The one place balances change
-- ---------------------------------------------------------------------------

-- Adds p_delta points to a rider. Returns the new balance. A repeated source (same kind, source and id) changes nothing and
-- returns the current balance, which makes earning safe to retry. Taking more than the balance fails with hint points_insufficient.
create function private.apply_points(
  p_rider uuid, p_delta integer, p_kind text, p_reason text,
  p_source_kind text default null, p_source_id uuid default null, p_by uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_new integer;
  v_inserted integer;
begin
  if p_delta = 0 then
    raise exception 'Zero points' using errcode = '22023', hint = 'points_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtext('points:' || p_rider::text));

  select points_balance into v_balance from public.riders where id = p_rider for update;
  if not found then
    raise exception 'Unknown customer' using errcode = '23503', hint = 'points_no_rider';
  end if;
  v_new := v_balance + p_delta;
  if v_new < 0 then
    raise exception 'Not enough points' using errcode = '23514', hint = 'points_insufficient';
  end if;

  insert into public.points_ledger (rider_id, delta, kind, reason, source_kind, source_id, created_by, balance_after)
  values (p_rider, p_delta, p_kind, coalesce(p_reason, ''), p_source_kind, p_source_id, p_by, v_new)
  on conflict (source_kind, source_id, kind) where source_id is not null do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return v_balance;
  end if;

  update public.riders set points_balance = v_new where id = p_rider;
  return v_new;
end;
$$;
revoke execute on function private.apply_points(uuid, integer, text, text, text, uuid, uuid) from public, anon, authenticated;

-- Staff give or take points from /admin (Klientai). Needs the klientai permission; the reason is required.
create function public.adjust_rider_points(p_rider uuid, p_delta integer, p_reason text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.has_permission('klientai')) then
    raise exception 'Not allowed' using errcode = '42501', hint = 'forbidden';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'Invalid points' using errcode = '22023', hint = 'points_invalid';
  end if;
  if btrim(coalesce(p_reason, '')) = '' or char_length(p_reason) > 200 then
    raise exception 'A reason is required' using errcode = '22023', hint = 'points_reason';
  end if;
  return private.apply_points(p_rider, p_delta, 'admin', btrim(p_reason), null, null, auth.uid());
end;
$$;
revoke execute on function public.adjust_rider_points(uuid, integer, text) from public, anon;
grant execute on function public.adjust_rider_points(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Earning: when an online order turns paid
-- ---------------------------------------------------------------------------

-- A reservation payment that came back paid without needing a manual look. Staff-made payment links and cash taken at
-- entry earn nothing. Earns on the cash charge (payments.amount) for the rider of the payment's requests.
create function private.earn_points_for_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.loyalty_settings;
  v_rider uuid;
  v_points integer;
begin
  select * into s from public.loyalty_settings where id;
  if not s.enabled or s.earn_points_per_euro <= 0 then
    return new;
  end if;
  select x.rider_id into v_rider from (
    select b.rider_id from public.bookings b where b.payment_id = new.id and b.rider_id is not null
    union all
    select q.rider_id from public.quad_rentals q where q.payment_id = new.id and q.rider_id is not null
    union all
    select t.rider_id from public.event_tickets t where t.payment_id = new.id and t.rider_id is not null
  ) x limit 1;
  v_points := floor(new.amount * s.earn_points_per_euro);
  if v_rider is not null and v_points > 0 then
    perform private.apply_points(v_rider, v_points, 'earn', 'Pirkimas', 'payment', new.id, null);
  end if;
  return new;
end;
$$;
revoke execute on function private.earn_points_for_payment() from public, anon, authenticated;

create trigger payments_earn_points
  after update of status on public.payments
  for each row
  when (old.status is distinct from 'apmoketa' and new.status = 'apmoketa' and not new.needs_review and not new.staff_created)
  execute function private.earn_points_for_payment();

-- A plan bought online by a rider.
create function private.earn_points_for_plan_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.loyalty_settings;
  v_points integer;
begin
  select * into s from public.loyalty_settings where id;
  if not s.enabled or s.earn_points_per_euro <= 0 or new.rider_id is null then
    return new;
  end if;
  v_points := floor(new.price * s.earn_points_per_euro);
  if v_points > 0 then
    perform private.apply_points(new.rider_id, v_points, 'earn', 'Planas: ' || new.plan_name, 'plan_order', new.id, null);
  end if;
  return new;
end;
$$;
revoke execute on function private.earn_points_for_plan_order() from public, anon, authenticated;

create trigger rider_plan_orders_earn_points
  after update of status on public.rider_plan_orders
  for each row
  when (old.status is distinct from 'apmoketa' and new.status = 'apmoketa')
  execute function private.earn_points_for_plan_order();

-- ---------------------------------------------------------------------------
-- What a signed-in customer sees (/paskyra)
-- ---------------------------------------------------------------------------

-- Balance and the latest 50 movements of every rider that belongs to this account (same matching as my_riders:
-- confirmed e-mail or confirmed phone). A family sharing a phone number sees one row per rider.
create function public.my_points()
returns table (rider_id uuid, rider_name text, balance integer, entries jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, btrim(r.name || ' ' || r.surname), r.points_balance,
         coalesce((
           select jsonb_agg(jsonb_build_object('delta', l.delta, 'kind', l.kind, 'reason', l.reason, 'at', l.created_at) order by l.created_at desc)
             from (select * from public.points_ledger x where x.rider_id = r.id order by x.created_at desc limit 50) l
         ), '[]'::jsonb)
    from public.riders r
    join auth.users u on u.id = (select auth.uid())
   where not r.needs_review
     and (
       (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
       or (u.phone_confirmed_at is not null
           and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 9
           and regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') = private.normalize_phone(r.phone))
     )
   order by r.created_at;
$$;
revoke execute on function public.my_points() from public, anon;
grant execute on function public.my_points() to authenticated;
