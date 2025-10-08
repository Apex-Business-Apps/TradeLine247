-- Enable extensions for geo + text search
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- Add search-related columns (nullable to avoid breaking inserts)
alter table public.vehicles
  add column if not exists province text,
  add column if not exists seats int,
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists make_model text;

-- Derive a tsvector for fast keyword queries
alter table public.vehicles
  add column if not exists search_vec tsvector;

-- Initialize make_model and search_vec for existing rows
update public.vehicles
set make_model = coalesce(make_model, concat_ws(' ', year::text, make, model)),
    search_vec = to_tsvector('simple',
                 coalesce(make_model,'') || ' ' ||
                 coalesce(trim(engine),'') || ' ' ||
                 coalesce(trim(exterior_color),''));

-- Keep search_vec fresh with trigger
create or replace function public.vehicles_searchvec_trigger() returns trigger language plpgsql as $$
begin
  new.make_model := coalesce(new.make_model, concat_ws(' ', new.year::text, new.make, new.model));
  new.search_vec := to_tsvector('simple',
    coalesce(new.make_model,'') || ' ' ||
    coalesce(new.engine,'') || ' ' ||
    coalesce(new.exterior_color,''));
  return new;
end $$;

drop trigger if exists trg_vehicles_searchvec on public.vehicles;
create trigger trg_vehicles_searchvec
  before insert or update of year, make, model, engine, exterior_color, make_model
  on public.vehicles
  for each row execute function public.vehicles_searchvec_trigger();

-- Indexes for performance
create index if not exists idx_vehicles_province on public.vehicles (province);
create index if not exists idx_vehicles_engine on public.vehicles (engine);
create index if not exists idx_vehicles_seats on public.vehicles (seats);
create index if not exists idx_vehicles_search_vec on public.vehicles using gin (search_vec);
create index if not exists idx_vehicles_make_model_trgm on public.vehicles using gin (make_model gin_trgm_ops);
create index if not exists idx_vehicles_geo on public.vehicles using gist (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) where longitude is not null and latitude is not null;