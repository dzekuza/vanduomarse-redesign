-- More guards for coupon money (security review of 20261114170000):
--   * the money-column trigger also covers INSERT: a signed-in staff member cannot create a coupon that already looks paid
--     or refunded, or carries Stripe ids or a discount;
--   * a cancelled coupon cannot be reopened by signed-in staff (the refund relies on it staying cancelled);
--   * redemption history is append-only for signed-in staff (the refund amount is computed from it);
--   * one coupon per Stripe payment.
create or replace function private.protect_coupon_money()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) is distinct from 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'laukia_apmokejimo'
       or new.stripe_payment_intent_id is not null
       or new.stripe_session_id is not null
       or new.paid_amount is not null
       or new.refunded_amount <> 0
       or new.refunded_at is not null
       or new.discount_amount <> 0 then
      raise exception 'Coupon payment fields cannot be set' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.face_value is distinct from old.face_value
     or new.discount_amount is distinct from old.discount_amount
     or new.paid_amount is distinct from old.paid_amount
     or new.refunded_amount is distinct from old.refunded_amount
     or new.refunded_at is distinct from old.refunded_at
     or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
     or new.stripe_session_id is distinct from old.stripe_session_id then
    raise exception 'Coupon payment fields cannot be edited' using errcode = '42501';
  end if;
  if old.status = 'atsauktas' and new.status <> 'atsauktas' then
    raise exception 'A cancelled coupon cannot be reopened' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger coupons_protect_money on public.coupons;
create trigger coupons_protect_money before insert or update on public.coupons
  for each row execute function private.protect_coupon_money();

create function private.coupon_redemptions_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' then
    raise exception 'Redemptions cannot be changed or removed' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger coupon_redemptions_append_only before update or delete on public.coupon_redemptions
  for each row execute function private.coupon_redemptions_append_only();

create unique index coupons_payment_intent_uidx on public.coupons (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
