create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

create table if not exists public.forwarding_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  old_number_e164 text not null,
  twilio_number_e164 text not null,
  status text not null default 'pending', -- pending|verified|failed
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  notes text
);

alter table public.forwarding_checks enable row level security;

create policy "org read forwarding_checks"
on public.forwarding_checks for select to authenticated
using (auth.jwt() ->> 'org_id' = org_id::text);

create policy "org insert forwarding_checks"
on public.forwarding_checks for insert to authenticated
with check (auth.jwt() ->> 'org_id' = org_id::text);

create policy "org update forwarding_checks"
on public.forwarding_checks for update to authenticated
using (auth.jwt() ->> 'org_id' = org_id::text)
with check (auth.jwt() ->> 'org_id' = org_id::text);
