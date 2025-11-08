create extension if not exists pgcrypto;
create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  error_id text,
  error_type text,
  payload jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.error_reports enable row level security;
create policy "read own org errors" on public.error_reports
  for select to authenticated using (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);
create policy "insert own org errors" on public.error_reports
  for insert to authenticated with check (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);
