-- Supabase schema for Phase 1
-- Run this in Supabase SQL editor.

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  kyc_status text check (kyc_status in ('pending', 'verified', 'rejected')) default 'pending',
  kyc_document_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create or replace function public.handle_profile_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
before update on public.profiles
for each row
execute function public.handle_profile_updated();


-- ITEMS
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  condition text check (condition in ('new', 'like_new', 'good', 'fair', 'poor')) default 'good',
  price numeric(10, 2) not null,
  currency text default 'INR',
  is_for_rent boolean default false,
  is_for_sale boolean default true,
  is_active boolean default true,
  thumbnail_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ITEM IMAGES (multiple images per item)
create table if not exists public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  position integer default 0,
  created_at timestamp with time zone default now()
);

create index if not exists item_images_item_id_idx on public.item_images(item_id);

-- Optional: enable updated_at behavior for items too
create or replace function public.handle_item_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_item_updated on public.items;
create trigger on_item_updated
before update on public.items
for each row
execute function public.handle_item_updated();


-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  status text check (status in ('pending', 'paid', 'cancelled', 'completed')) default 'pending',
  quantity integer default 1,
  total_amount numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);


-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null,
  direction text check (direction in ('debit', 'credit')) not null,
  status text check (status in ('initiated', 'success', 'failed')) default 'initiated',
  gateway_ref text,
  created_at timestamp with time zone default now()
);


-- STORAGE: create bucket `kyc_documents` in Supabase UI.
-- STORAGE: create bucket `item_images` in Supabase UI (public bucket recommended for easy public URLs).
-- Then add RLS policies similar to:
-- - Only authenticated users can upload.
-- - Users can only access objects where folder matches their auth.uid().

