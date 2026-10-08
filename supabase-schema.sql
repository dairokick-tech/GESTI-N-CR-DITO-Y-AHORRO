-- CREDICONTAFI - estructura mínima para sincronización online.
create table if not exists public.credicontafi_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.credicontafi_clients (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
-- Para una instalación real, configure RLS y políticas según sus roles.
alter table public.credicontafi_state enable row level security;
alter table public.credicontafi_clients enable row level security;
create policy "authenticated state full access" on public.credicontafi_state for all to authenticated using (true) with check (true);
create policy "authenticated clients full access" on public.credicontafi_clients for all to authenticated using (true) with check (true);
