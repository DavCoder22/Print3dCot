-- Ejecutar esto en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- Crea la tabla de usuarios para Print3dCot

create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

-- Permitir lectura/escritura solo con service_role key (desde el backend)
alter table public.users enable row level security;

create policy "Solo el backend puede acceder a users"
  on public.users
  for all
  using (true)
  with check (true);
