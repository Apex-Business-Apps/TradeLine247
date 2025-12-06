-- Hardened Twilio job queue (idempotent)

create extension if not exists pgcrypto;

create table if not exists public.twilio_job_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  kind text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint twilio_job_queue_status_ck check (status in ('pending','processing','done','failed'))
);

alter table public.twilio_job_queue
  add column if not exists priority integer not null default 0,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text,
  add column if not exists dedupe_key text;

create unique index if not exists twilio_job_queue_dedupe_key_idx on public.twilio_job_queue (dedupe_key) where dedupe_key is not null;
create index if not exists twilio_job_queue_ready_idx on public.twilio_job_queue (status, priority desc, next_run_at);

alter table public.twilio_job_queue
  alter column priority set default 0,
  alter column priority set not null;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'twilio_job_queue'
      AND column_name = 'locked_by'
      AND data_type <> 'text'
  ) THEN
    EXECUTE 'alter table public.twilio_job_queue alter column locked_by type text using locked_by::text';
  END IF;
END $$;

comment on table public.twilio_job_queue is 'Queue of outbound Twilio operations with exponential backoff and dedupe';

alter table public.twilio_job_queue enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'twilio_job_queue' AND policyname = 'org read own jobs v2') THEN
    create policy "org read own jobs v2"
      on public.twilio_job_queue
      for select
      to authenticated
      using (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'twilio_job_queue' AND policyname = 'org insert own jobs v2') THEN
    create policy "org insert own jobs v2"
      on public.twilio_job_queue
      for insert
      to authenticated
      with check (org_id is null or auth.jwt() ->> 'org_id' = org_id::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'twilio_job_queue' AND policyname = 'org update own jobs v2') THEN
    create policy "org update own jobs v2"
      on public.twilio_job_queue
      for update
      to authenticated
      using (auth.jwt() ->> 'org_id' = org_id::text)
      with check (auth.jwt() ->> 'org_id' = org_id::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'twilio_job_queue' AND policyname = 'service role manage jobs v2') THEN
    create policy "service role manage jobs v2"
      on public.twilio_job_queue
      for all
      using (auth.role() = 'service_role');
  END IF;
END $$;
