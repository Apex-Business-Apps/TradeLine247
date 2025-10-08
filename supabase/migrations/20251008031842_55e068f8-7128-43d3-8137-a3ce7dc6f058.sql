-- Create secure vehicle search RPC with radius filtering, pagination, and sorting
create or replace function public.vehicles_search(
  p_q text default null,
  p_province text default null,
  p_engine text[] default null,
  p_seats_min int default null,
  p_seats_max int default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default null,
  p_sort text default 'relevance',
  p_offset int default 0,
  p_limit int default 20
)
returns table (
  id uuid,
  make text,
  model text,
  year int,
  price numeric,
  mileage int,
  engine text,
  seats int,
  province text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
) language sql stable security definer
set search_path = public as $$
  with base as (
    select v.*,
      case
        when p_lat is not null and p_lng is not null
        then ST_DistanceSphere(
               ST_SetSRID(ST_MakePoint(v.longitude, v.latitude),4326),
               ST_SetSRID(ST_MakePoint(p_lng, p_lat),4326)
             ) / 1000.0
        else null
      end as distance_km
    from public.vehicles v
    where (p_province is null or v.province = p_province)
      and (p_engine   is null or v.engine = any(p_engine))
      and (p_seats_min is null or v.seats >= p_seats_min)
      and (p_seats_max is null or v.seats <= p_seats_max)
      and (
        p_q is null
        or v.search_vec @@ plainto_tsquery('simple', p_q)
        or v.make_model ilike '%'||p_q||'%'
      )
      and (
        p_radius_km is null
        or (p_lat is not null and p_lng is not null and
            ST_DWithin(
              ST_SetSRID(ST_MakePoint(v.longitude, v.latitude),4326),
              ST_SetSRID(ST_MakePoint(p_lng, p_lat),4326),
              p_radius_km * 1000.0
            )
          )
      )
  )
  select id, make, model, year, price, mileage, engine, seats, province, latitude, longitude, distance_km
  from base
  order by
    case when p_sort='price_asc' then price end asc nulls last,
    case when p_sort='price_desc' then price end desc nulls last,
    case when p_sort='year_desc' then year end desc nulls last,
    case when p_sort='distance_asc' then distance_km end asc nulls last,
    case when p_sort='relevance' then ts_rank(search_vec, plainto_tsquery('simple', coalesce(p_q,''))) end desc nulls last,
    similarity(make_model, coalesce(p_q,'')) desc nulls last,
    id asc
  offset greatest(p_offset,0) limit least(p_limit,100);
$$;

-- Grant execute permission to authenticated users
grant execute on function public.vehicles_search to authenticated;