create table if not exists public.telephony_subaccounts (
  org_id uuid primary key,
  business_name text not null,
  subaccount_sid text not null,
  created_at timestamptz default now()
);

create table if not exists public.telephony_numbers (
  org_id uuid primary key references public.telephony_subaccounts(org_id) on delete cascade,
  subaccount_sid text not null,
  e164_number text not null,
  country text not null default 'CA',
  created_at timestamptz default now()
);

-- RLS: allow only service role (functions) to write
alter table public.telephony_subaccounts enable row level security;
alter table public.telephony_numbers enable row level security;

create policy telephony_subaccounts_ro on public.telephony_subaccounts for select using (auth.role() = 'authenticated');
create policy telephony_numbers_ro on public.telephony_numbers for select using (auth.role() = 'authenticated');
