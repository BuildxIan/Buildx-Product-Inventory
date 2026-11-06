-- 002 — keep the original upload next to the optimised display copy
--
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Additive and idempotent. No row is changed, no file is moved or deleted:
-- existing photos keep original_path = NULL and continue to use `path`, which
-- is the optimised copy that was uploaded before this feature existed.
--
-- After running this, newly uploaded photos are stored twice:
--   <product>/<id>.jpg           -> optimised display copy (max 1280px, JPEG)
--   <product>/<id>-original.jpg  -> the untouched file, byte for byte
--
-- Until this runs the app still works; it simply uploads the optimised copy
-- only and the download dialog labels the stored file as optimised.

alter table public.product_images add column if not exists original_path text;

-- Optional: make sure anonymous visitors cannot read the table directly.
-- (Left commented out — the current RLS policies are unchanged on purpose.)
-- alter policy "read all" on public.product_images to authenticated using (true);
