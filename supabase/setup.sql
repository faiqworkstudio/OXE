-- OXE Marketing: database setup for the admin (leads + security log).
-- Run in Supabase → SQL Editor → New query → Run. Safe to run again after updates.
--
-- Only the website's server functions use these tables, with the secret
-- SUPABASE_SERVICE_ROLE_KEY. Row Level Security is on with no policies, so the
-- public (anon / publishable) key can't read or change anything in them.

-- ---------------------------------------------------------------- leads
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null,
  email       text,
  phone       text,
  company     text,
  services    text[] not null default '{}',
  budget      text,
  method      text,                         -- preferred reply: Email / Phone / WhatsApp
  message     text,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  value       numeric,                      -- expected deal value (THB)
  follow_up   date,                         -- next follow-up date
  source      text,                         -- "Website form", "Phone call", …
  page        text,                         -- page the form was sent from
  utm         jsonb not null default '{}',  -- utm_source, utm_medium, utm_campaign, referrer
  activity    jsonb not null default '[]'   -- [{ at, by, type, text }]
);
-- sender fingerprint (a keyed hash of the IP address, never the IP itself), for rate limits
alter table public.leads add column if not exists ip_hash text;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_ip_hash_idx on public.leads (ip_hash, created_at desc);

alter table public.leads enable row level security;

create or replace function public.leads_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch();

-- ---------------------------------------------------------------- security log
-- Failed logins and password-reset requests, so repeated attempts can be locked out.
-- Keys are "email:<address>" or "ip:<keyed hash>". Old rows are removed automatically.
create table if not exists public.security_events (
  id    bigint generated always as identity primary key,
  at    timestamptz not null default now(),
  kind  text not null,
  key   text not null
);
create index if not exists security_events_lookup_idx on public.security_events (kind, key, at desc);
alter table public.security_events enable row level security;

-- ---------------------------------------------------------------- lock down
-- Nothing above is for the public API keys; the server uses the service role key.
revoke all on public.leads, public.security_events from anon, authenticated;

-- Explicit "deny everything" policies for the public roles. RLS with no policies already
-- denies all access; these make that intent visible (and clear Supabase's
-- "RLS Enabled No Policy" advisor notice). The service role bypasses RLS, so the
-- website's server functions keep working.
drop policy if exists "No public access" on public.leads;
create policy "No public access" on public.leads
  as restrictive for all to anon, authenticated using (false) with check (false);
drop policy if exists "No public access" on public.security_events;
create policy "No public access" on public.security_events
  as restrictive for all to anon, authenticated using (false) with check (false);
