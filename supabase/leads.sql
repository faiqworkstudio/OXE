-- OXE Marketing: leads table for the admin's Leads workspace.
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- Only the website's server functions read and write this table (with the
-- SUPABASE_SERVICE_ROLE_KEY). Row Level Security is on with no policies, so the
-- public anon key can't read or change any lead.

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
  source      text,                         -- "Website form", "Manual", "Phone call", …
  page        text,                         -- page the form was sent from
  utm         jsonb not null default '{}',  -- utm_source, utm_medium, utm_campaign, referrer
  activity    jsonb not null default '[]'   -- [{ at, by, type, text }]
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

create or replace function public.leads_touch() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch();
