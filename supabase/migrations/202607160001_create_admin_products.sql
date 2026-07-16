-- SupraQuím: productos, administradores y storage.
-- Ejecutar en Supabase SQL Editor o mediante Supabase CLI.

create extension if not exists "pgcrypto";

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = uid
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "Admins can read their profile" on public.admin_profiles;
create policy "Admins can read their profile"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid() and role = 'admin');

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  nombre text not null,
  categoria text not null,
  precio integer check (precio is null or precio >= 0),
  presentacion text not null,
  descripcion text,
  usos text[] not null default '{}',
  caracteristicas text[] not null default '{}',
  especificaciones jsonb not null default '{}'::jsonb,
  imagen text not null,
  destacado boolean not null default false,
  activo boolean not null default true,
  stock integer check (stock is null or stock >= 0),
  orden integer,
  informacion_pendiente boolean not null default false,
  extraccion_incompleta boolean not null default false,
  texto_visual text,
  source_file text,
  source_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_activo_idx on public.products (activo);
create index if not exists products_categoria_idx on public.products (categoria);
create index if not exists products_orden_nombre_idx on public.products (orden nulls last, nombre);

create or replace function public.touch_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at
before update on public.products
for each row
execute function public.touch_products_updated_at();

alter table public.products enable row level security;

drop policy if exists "Visitors can read active products" on public.products;
create policy "Visitors can read active products"
on public.products
for select
to anon, authenticated
using (activo = true);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products"
on public.products
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'product-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin(auth.uid()));

-- Para conceder acceso a un administrador:
-- 1. Crear usuario en Supabase Auth.
-- 2. Ejecutar reemplazando el UUID:
-- insert into public.admin_profiles (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin')
-- on conflict (user_id) do update set role = 'admin';
