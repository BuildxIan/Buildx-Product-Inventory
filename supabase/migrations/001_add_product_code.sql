-- 001 — add the product code field
--
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Additive and idempotent: no rows are changed and no codes are generated.
-- Existing products keep code = NULL and display "Not set" until you fill it in
-- from the product form.

alter table public.products add column if not exists code text;

-- Optional but recommended once codes exist and you want them unique:
-- create unique index if not exists products_code_key on public.products (upper(code));
