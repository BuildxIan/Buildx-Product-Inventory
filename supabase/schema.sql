-- Run this whole file once in Supabase: SQL Editor -> New query -> paste -> Run.

-- ---------- Tables ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- null = top-level category; otherwise the category this one sits under.
  -- Deleting a parent promotes its subcategories instead of deleting them.
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Existing databases created before hierarchical categories: add it in place.
alter table public.categories add column if not exists parent_id uuid;

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

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  name text not null,
  price numeric(12,2) not null default 0,
  code text,                    -- stock-keeping code, e.g. "TILE-001"
  description text,
  source_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- Existing databases created before the product-code field: add it in place.
alter table public.products add column if not exists code text;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,            -- optimised copy inside the "product-images" bucket
  original_path text,            -- untouched upload, when stored (see migration 002)
  position int not null default 0
);

-- Existing databases created before original-image preservation.
alter table public.product_images add column if not exists original_path text;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,           -- e.g. "Black", "Size M"
  color_hex text,                -- optional swatch color, e.g. #111111
  price numeric(12,2),           -- optional price override
  position int not null default 0
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists product_images_product_idx on public.product_images(product_id);
create index if not exists product_variants_product_idx on public.product_variants(product_id);

-- ---------- Row Level Security ----------
-- Everyone can read. Only a logged-in user can write.
alter table public.categories       enable row level security;
alter table public.shops            enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','shops','products','product_images','product_variants']
  loop
    execute format('drop policy if exists "read all" on public.%I', t);
    execute format('drop policy if exists "write authenticated" on public.%I', t);
    execute format('create policy "read all" on public.%I for select using (true)', t);
    execute format(
      'create policy "write authenticated" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- Storage bucket for product photos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "images public read" on storage.objects;
drop policy if exists "images authenticated write" on storage.objects;
drop policy if exists "images authenticated update" on storage.objects;
drop policy if exists "images authenticated delete" on storage.objects;

create policy "images public read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "images authenticated write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "images authenticated update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "images authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
