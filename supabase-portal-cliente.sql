-- CREDICONTAFI · Portal Cliente + Supabase Auth
-- NO elimina ni modifica registros existentes.
-- Ejecutar UNA VEZ en Supabase > SQL Editor.

create table if not exists public.client_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.client_accounts enable row level security;

drop policy if exists "client_accounts_own" on public.client_accounts;
create policy "client_accounts_own"
on public.client_accounts for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.link_client_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dni text;
  v_name text;
  v_email text;
  v_client_id text;
  v_has_credit boolean;
begin
  v_dni := trim(coalesce(new.raw_user_meta_data->>'dni',''));
  v_name := lower(trim(coalesce(new.raw_user_meta_data->>'full_name','')));
  v_email := lower(trim(coalesce(new.email,'')));

  select c.id::text
    into v_client_id
  from public.clients c
  where trim(coalesce(c.dni::text,'')) = v_dni
    and lower(trim(coalesce(c.name,''))) = v_name
    and (nullif(trim(coalesce(c.email,'')),'') is null
         or lower(trim(c.email)) = v_email)
  limit 1;

  if v_client_id is null then
    raise exception 'No existe un cliente habilitado con el DNI, nombres y correo indicados.';
  end if;

  select exists(
    select 1
    from public.credits cr
    where cr.client_id::text = v_client_id
  ) into v_has_credit;

  if not v_has_credit then
    raise exception 'El cliente no tiene un crédito registrado. No se puede crear el acceso al portal.';
  end if;

  insert into public.client_accounts(user_id, client_id)
  values (new.id, v_client_id)
  on conflict (user_id) do update set client_id = excluded.client_id;

  return new;
end;
$$;

drop trigger if exists on_auth_client_created on auth.users;
create trigger on_auth_client_created
after insert on auth.users
for each row execute procedure public.link_client_auth_user();

create or replace function public.get_client_portal()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_id text;
  v_client jsonb;
  v_credits jsonb;
  v_payments jsonb;
  v_installments jsonb;
  v_products jsonb;
  v_documents jsonb;
begin
  select client_id into v_client_id
  from public.client_accounts
  where user_id = (select auth.uid());

  if v_client_id is null then
    raise exception 'Cuenta de cliente no vinculada.';
  end if;

  select to_jsonb(c) into v_client
  from public.clients c
  where c.id::text = v_client_id;

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_credits
  from public.credits x
  where x.client_id::text = v_client_id;

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into v_payments
  from public.payments p
  where exists (
    select 1 from public.credits cr
    where cr.id::text = p.credit_id::text
      and cr.client_id::text = v_client_id
  );

  select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) into v_installments
  from public.credit_installments i
  where exists (
    select 1 from public.credits cr
    where cr.id::text = i.credit_id::text
      and cr.client_id::text = v_client_id
  );

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into v_products
  from public.products p
  where coalesce(p.active, true) = true;

  select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) into v_documents
  from public.documents d
  where d.client_id::text = v_client_id;

  return jsonb_build_object(
    'client', coalesce(v_client, '{}'::jsonb),
    'credits', v_credits,
    'payments', v_payments,
    'installments', v_installments,
    'products', v_products,
    'documents', v_documents
  );
end;
$$;

create or replace function public.submit_client_credit_request(
  p_product_id text,
  p_amount numeric,
  p_term_months integer,
  p_purpose text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_id text;
  v_row jsonb;
begin
  select client_id into v_client_id
  from public.client_accounts
  where user_id = (select auth.uid());

  if v_client_id is null then
    raise exception 'Cuenta de cliente no vinculada.';
  end if;

  insert into public.credit_requests
    (id, client_id, product_id, amount, term_months, interest_rate, purpose, notes, status, created_at)
  select
    gen_random_uuid()::text,
    v_client_id,
    nullif(p_product_id,''),
    p_amount,
    p_term_months,
    coalesce(pr.monthly_rate,0),
    p_purpose,
    p_notes,
    'PENDIENTE_APROBACION',
    now()
  from public.products pr
  where pr.id::text = nullif(p_product_id,'');

  if not found then
    insert into public.credit_requests
      (id, client_id, product_id, amount, term_months, interest_rate, purpose, notes, status, created_at)
    values
      (gen_random_uuid()::text, v_client_id, nullif(p_product_id,''), p_amount, p_term_months, 0, p_purpose, p_notes, 'PENDIENTE_APROBACION', now());
  end if;

  select to_jsonb(x) into v_row
  from public.credit_requests x
  where x.client_id::text = v_client_id
  order by x.created_at desc
  limit 1;

  return v_row;
end;
$$;

revoke all on public.client_accounts from anon;
revoke all on public.client_accounts from authenticated;

grant execute on function public.get_client_portal() to authenticated;
grant execute on function public.submit_client_credit_request(text,numeric,integer,text,text) to authenticated;
