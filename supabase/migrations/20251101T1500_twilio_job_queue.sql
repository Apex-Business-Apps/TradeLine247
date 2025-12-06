-- Twilio Job Queue for Rate-Limit Reliability
-- Prevents 429/20429 errors by queuing and retrying Twilio API calls

create extension if not exists pgcrypto;

create table if not exists public.twilio_job_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  kind text not null,                       -- 'call' | 'callerid.verify' | 'number.update' ...
  payload jsonb not null,                   -- parameters for the job
  status text not null default 'pending',   -- pending|processing|done|failed
  attempts int not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists twilio_job_queue_status_idx on public.twilio_job_queue(status, next_run_at);

alter table public.twilio_job_queue enable row level security;

create policy "org read own jobs"
  on public.twilio_job_queue
  for select
  to authenticated
  using (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);

create policy "org insert own jobs"
  on public.twilio_job_queue
  for insert
  to authenticated
  with check (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);

create policy "org update own jobs"
  on public.twilio_job_queue
  for update
  to authenticated
  using (auth.jwt() ->> 'org_id' = org_id::text)
  with check (auth.jwt() ->> 'org_id' = org_id::text);

-- Service role can manage all jobs (for queue worker)
create policy "service role can manage all jobs"
  on public.twilio_job_queue
  for all
  using (auth.role() = 'service_role');

