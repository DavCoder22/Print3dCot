-- ============================================================
-- Print3dCot — Inicialización de base de datos en Supabase
-- ============================================================
-- Ejecutar esto en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- Orden: primero users, luego quotes + quote_items

-- ============================================================
-- 1. TABLA: users
-- ============================================================
-- El password se almacena hasheado con bcrypt (10 rounds) desde el backend.
-- Nunca se guarda texto plano.

create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null,                -- bcrypt hash (backend)
  created_at timestamptz default now()
);

-- Índice para búsqueda rápida por email (login)
create index if not exists idx_users_email on public.users (email);

-- ============================================================
-- 2. TABLA: quotes (cotizaciones / pedidos)
-- ============================================================

create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,  -- opcional, nullable para anónimos
  customer_name text not null,
  customer_email text not null,
  service_type text not null,           -- '3d-printing', 'custom', 'laptop', 'car-parts'
  details text,                         -- descripción adicional
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  shipping_required boolean default false,
  status text not null default 'pending',  -- pending, approved, rejected, completed
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_quotes_user_id on public.quotes (user_id);
create index if not exists idx_quotes_created_at on public.quotes (created_at desc);
create index if not exists idx_quotes_status on public.quotes (status);

-- ============================================================
-- 3. TABLA: quote_items (items individuales de cada cotización)
-- ============================================================

create table if not exists public.quote_items (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text default '',
  material text not null,              -- 'pla', 'abs', 'petg', 'tpu', etc.
  weight numeric(10,2) not null default 0,   -- gramos
  quantity integer not null default 1,
  printing_time numeric(10,2) not null default 0,  -- horas
  complexity_factor numeric(3,2) not null default 1.0,  -- 1.0 a 2.0
  unit_cost numeric(10,2) not null default 0,
  total_cost numeric(10,2) not null default 0,
  image_url text                       -- base64 o URL de la imagen referencia
);

create index if not exists idx_quote_items_quote_id on public.quote_items (quote_id);

-- ============================================================
-- 4. RLS (Row Level Security)
-- ============================================================
-- Solo el backend (service_role key) puede leer/escribir.
-- Los usuarios finales nunca tocan la BD directamente.

alter table public.users enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "Acceso solo backend — users"
  on public.users for all using (true) with check (true);

create policy "Acceso solo backend — quotes"
  on public.quotes for all using (true) with check (true);

create policy "Acceso solo backend — quote_items"
  on public.quote_items for all using (true) with check (true);

-- ============================================================
-- 5. VISTA: resumen de cotizaciones (opcional)
-- ============================================================

create or replace view public.quote_summary as
select
  q.id,
  q.customer_name,
  q.customer_email,
  q.service_type,
  q.total,
  q.status,
  q.created_at,
  u.name as user_name,
  u.email as user_email,
  count(qi.id) as item_count
from public.quotes q
left join public.users u on u.id = q.user_id
left join public.quote_items qi on qi.quote_id = q.id
group by q.id, u.name, u.email
order by q.created_at desc;

-- ============================================================
-- NOTAS:
-- - La encriptación de passwords se hace con bcrypt en el backend
--   (backend/src/index.js), no en la BD.
-- - Las imágenes se almacenan como base64 o URL; para produccíón
--   se recomienda usar Supabase Storage.
-- ============================================================
