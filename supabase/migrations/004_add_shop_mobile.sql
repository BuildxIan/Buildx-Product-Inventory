-- 004_add_shop_mobile.sql
--
-- Adds one optional contact number to `shops` so a customer reading a product
-- can reach the shop that sells it.
--
-- The number is stored exactly once, on the shop — never copied onto products.
-- A product detail resolves its number through `product.shop_id`, so editing a
-- shop's number changes it on every product of that shop at the same time, and
-- there is nothing to keep in sync. That also means this migration rewrites no
-- product rows: every existing product picks the number up the moment the shop
-- has one.
--
-- Nullable on purpose: a shop without a number shows no row at all in the
-- product details, rather than an empty field. Every existing shop keeps
-- `mobile = null` and behaves exactly as it did before.
--
-- The migration is additive and idempotent — run it once, or run it again and
-- nothing happens.

alter table public.shops
  add column if not exists mobile text;

comment on column public.shops.mobile is
  'Contact number for this shop, shown on every product of the shop. Null = hide the field.';
