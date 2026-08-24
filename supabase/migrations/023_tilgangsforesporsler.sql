-- P57: Uinnlogget tilgangsforespørsel ved innlogging
-- Ny tabell for lærere uten konto som ber om tilgang fra innloggingssiden.
-- Fag/parti-valget er REN INFORMASJON til admin (tekst-snapshot, ikke FK) —
-- kontoen finnes ikke ennå, så ingen kobling lærer↔fag/parti opprettes her.

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  full_name text not null,
  email text not null,
  requested_role text not null check (requested_role in ('laerer', 'kontaktlaerer')),
  subjects_text text[] not null default '{}',
  divisions_text text[] not null default '{}',
  message text,
  status text not null default 'venter' check (status in ('venter', 'godkjent', 'avvist')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references users(id),
  constraint access_requests_email_domene check (email ~* '@skole\.rogfk\.no$')
);

alter table access_requests enable row level security;

-- Ingen insert-policy for anon/authenticated — innsending skjer KUN via
-- edge function `request-access` med service-role-nøkkel (samme mønster
-- som create-user/admin-user). RLS blokkerer dermed direkte klient-innsetting.

create policy "access_requests_admin_all"
  on access_requests for all
  using (school_id = auth_school_id() and is_active_admin());

-- Eneste uinnloggede lesevei inn i users-tabellen: kun fornavn på
-- skolens admin(er), til visning på innloggingssiden («Din forespørsel
-- går til …»). Ingen andre felt eksponeres.
create or replace function public_admin_fornavn()
returns text[] language sql stable security definer as $$
  select coalesce(array_agg(split_part(full_name, ' ', 1) order by full_name), array[]::text[])
  from users
  where (is_admin = true or role = 'admin') and deleted_at is null;
$$;

grant execute on function public_admin_fornavn() to anon, authenticated;
