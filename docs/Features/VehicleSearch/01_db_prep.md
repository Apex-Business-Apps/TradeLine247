# Vehicle Search - Database Preparation

## Overview
This migration prepares the `vehicles` table for fast filtered search with geographic and full-text search capabilities.

## Migration Applied
**File**: `supabase/migrations/[timestamp]_vehicle_search_prep.sql`

## Changes Made

### 1. Extensions Enabled
- ✅ **PostGIS**: Geographic/spatial queries (proximity search)
- ✅ **pg_trgm**: Trigram text search (fuzzy matching)

### 2. New Columns Added
| Column | Type | Purpose |
|--------|------|---------|
| `province` | text | Filter by Canadian province (AB, BC, ON, etc.) |
| `engine` | text | Engine type (I4, V6, Hybrid, EV) |
| `seats` | int | Number of seats |
| `latitude` | double precision | Geographic coordinate for proximity search |
| `longitude` | double precision | Geographic coordinate for proximity search |
| `make_model` | text | Derived field: "2024 Toyota Camry" |
| `search_vec` | tsvector | Full-text search vector (auto-updated) |

### 3. Trigger Created
**Function**: `vehicles_searchvec_trigger()`
- Automatically maintains `make_model` and `search_vec` columns
- Fires on INSERT/UPDATE of year, make, model, engine, exterior_color, make_model

### 4. Indexes Created
| Index | Type | Purpose |
|-------|------|---------|
| `idx_vehicles_province` | btree | Fast province filtering |
| `idx_vehicles_engine` | btree | Fast engine type filtering |
| `idx_vehicles_seats` | btree | Fast seat count filtering |
| `idx_vehicles_search_vec` | GIN | Full-text search performance |
| `idx_vehicles_make_model_trgm` | GIN | Fuzzy text matching (autocomplete) |
| `idx_vehicles_geo` | GiST | Spatial queries (nearby vehicles) |

## Verification

### Check Extensions
```sql
select extname, extversion from pg_extension where extname in ('postgis', 'pg_trgm');
```

### Check Columns
```sql
select column_name, data_type 
from information_schema.columns 
where table_name = 'vehicles' 
  and column_name in ('province', 'engine', 'seats', 'latitude', 'longitude', 'make_model', 'search_vec');
```

### Check Indexes
```sql
select indexname, indexdef 
from pg_indexes 
where tablename = 'vehicles' 
  and indexname like 'idx_vehicles_%';
```

### Check Trigger
```sql
select trigger_name, event_manipulation, event_object_table 
from information_schema.triggers 
where trigger_name = 'trg_vehicles_searchvec';
```

## Security Notes
⚠️ **Extension in Public Schema**: PostGIS and pg_trgm were installed in the public schema. This is acceptable for this use case as these are trusted PostgreSQL extensions commonly used in production.

⚠️ **Function Search Path**: The trigger function `vehicles_searchvec_trigger()` should ideally have `SET search_path` configured for additional security hardening.

## Pass Criteria
- ✅ Migration applies cleanly without errors
- ✅ All 6 indexes created successfully
- ✅ Trigger function executes on vehicle updates
- ✅ search_vec auto-populates for new/updated vehicles
- ✅ PostGIS and pg_trgm extensions available

## Next Steps
1. **PROMPT 2**: Create vehicle search API endpoint
2. **PROMPT 3**: Build UI search components with filters
3. **PROMPT 4**: Add proximity search (find vehicles near me)

---

**Status**: ✅ COMPLETE  
**Date**: 2025-10-08  
**Migration File**: Check Supabase dashboard → Database → Migrations
