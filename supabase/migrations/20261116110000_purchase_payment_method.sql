-- How a bracelet plan sale was paid at the till (card or cash). Chosen by staff after the plan is assigned and the bracelet
-- scanned, so it is set once on an existing purchase. `purchases` stays append-only for staff (no update policy); the only
-- way to fill the column is this function, which needs the Apyrankės permission and refuses a purchase that already has one.
alter table public.purchases
  add column payment_method text check (payment_method in ('kortele', 'grynais'));

comment on column public.purchases.payment_method is 'kortele (card) or grynais (cash), set once by staff at the till; null = not recorded.';

create function public.set_purchase_payment(p_purchase_id uuid, p_method text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n int;
begin
  if not (select private.has_permission('apyrankes')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_method is null or p_method not in ('kortele', 'grynais') then
    raise exception 'invalid method' using errcode = '22023', hint = 'invalid_method';
  end if;
  update public.purchases set payment_method = p_method where id = p_purchase_id and payment_method is null;
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

revoke execute on function public.set_purchase_payment(uuid, text) from public, anon;
grant execute on function public.set_purchase_payment(uuid, text) to authenticated;
