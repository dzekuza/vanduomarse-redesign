-- The paid coupon code is exchanged for a season pass by the park team.
insert into public.coupon_products (id, kind, service, name, description, value, sort_order)
values
  ('wake-abonementas-sezonas', 'paslauga', 'kabelis', 'WAKE sezono abonementas', 'Plaukimas kabeline trasa visą sezoną.', 750, 7),
  ('wake-abonementas-sezonas-pirtis', 'paslauga', 'kabelis', 'WAKE sezono abonementas + pirtis', 'Plaukimas kabeline trasa ir neriboti apsilankymai pirtyje visą sezoną.', 950, 8)
on conflict (id) do nothing;
