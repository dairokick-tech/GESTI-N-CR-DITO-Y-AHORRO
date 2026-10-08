-- CREDICONTAFI · Sincronización online
-- Ejecutar TODO este archivo en Supabase SQL Editor.
-- Para producción financiera se recomienda Auth + RLS por usuario/rol.

create table if not exists public.credicontafi_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.credicontafi_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.credicontafi_state enable row level security;

drop policy if exists "credicontafi_public_select" on public.credicontafi_state;
drop policy if exists "credicontafi_public_insert" on public.credicontafi_state;
drop policy if exists "credicontafi_public_update" on public.credicontafi_state;

create policy "credicontafi_public_select"
on public.credicontafi_state for select
using (true);

create policy "credicontafi_public_insert"
on public.credicontafi_state for insert
to anon
with check (id = 'main');

create policy "credicontafi_public_update"
on public.credicontafi_state for update
to anon
using (id = 'main')
with check (id = 'main');

-- Tabla específica de clientes: permite sincronización entre dispositivos
-- sin depender de localStorage del navegador.
create table if not exists public.credicontafi_clients (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.credicontafi_clients enable row level security;

drop policy if exists "credicontafi_clients_public_select" on public.credicontafi_clients;
drop policy if exists "credicontafi_clients_public_insert" on public.credicontafi_clients;
drop policy if exists "credicontafi_clients_public_update" on public.credicontafi_clients;

create policy "credicontafi_clients_public_select"
on public.credicontafi_clients for select
using (true);

create policy "credicontafi_clients_public_insert"
on public.credicontafi_clients for insert
to anon
with check (id is not null);

create policy "credicontafi_clients_public_update"
on public.credicontafi_clients for update
to anon
using (true)
with check (id is not null);

-- IMPORTANTE: estas políticas son para DEMO. Para producción no dejes
-- información financiera accesible públicamente; usa Supabase Auth y RLS.
