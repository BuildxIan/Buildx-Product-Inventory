-- 003_add_category_parent.sql
--
-- Adds one optional self-reference to `categories` so a category can sit under
-- a parent category. Top-level categories keep `parent_id = null`, which is why
-- the column is nullable: every row that already exists stays exactly where it
-- is, with no data rewritten and no product reassigned.
--
-- The foreign key uses `on delete set null` on purpose. Deleting a parent must
-- never delete the subcategories or the products filed under them: the children
-- are simply promoted to top-level categories, and their products keep their
-- category. (Products already use the same rule for `category_id`.)
--
-- The migration is additive and idempotent — run it once, or run it again and
-- nothing happens.

alter table public.categories
  add column if not exists parent_id uuid;

-- Only add the constraint when it is not there yet (re-running this file must
-- not fail with "constraint already exists").
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_parent_id_fkey'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_parent_id_fkey
      foreign key (parent_id) references public.categories(id) on delete set null;
  end if;
end $$;

-- The sidebar loads every category, and every filter resolves a parent's
-- descendants, so this lookup is worth an index.
create index if not exists categories_parent_idx on public.categories(parent_id);
