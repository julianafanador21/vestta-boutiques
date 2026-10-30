-- VESTTA — ejecuta este SQL en el SQL Editor de tu proyecto Supabase.
-- Dashboard → SQL Editor → New query → Run

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  store_name text not null default 'Mi boutique',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  sku text,
  description text,
  price numeric(12, 2) not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  color_name text not null,
  color_hex text not null default '#8E2A3F',
  size text not null,
  stock integer not null default 0,
  image_url text
);

create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "products_own" on public.products;
create policy "products_own" on public.products
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "variants_own" on public.product_variants;
create policy "variants_own" on public.product_variants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, store_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'store_name', 'Mi boutique')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_own_write" on storage.objects;
create policy "product_images_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "product_images_own_update" on storage.objects;
create policy "product_images_own_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "product_images_own_delete" on storage.objects;
create policy "product_images_own_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
