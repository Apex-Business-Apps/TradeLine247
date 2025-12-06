create extension if not exists pgcrypto;
create table if not exists public.twilio_job_queue(
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  kind text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts int not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists twilio_job_queue_status_idx on public.twilio_job_queue(status, next_run_at);
alter table public.twilio_job_queue enable row level security;
create policy "org read"  on public.twilio_job_queue for select to authenticated using (org_id is null or auth.jwt()->>'org_id'=org_id::text);
create policy "org write" on public.twilio_job_queue for insert to authenticated with check (org_id is null or auth.jwt()->>'org_id'=org_id::text);
