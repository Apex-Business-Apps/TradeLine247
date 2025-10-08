# Vehicle Search - API Layer (Edge Function)

## Overview
Secure, rate-limited Edge Function that exposes vehicle search functionality with input validation and authentication.

## Endpoint

```
POST https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search
```

## Authentication

**Required**: Bearer token (JWT) from Supabase Auth

```bash
Authorization: Bearer <user-jwt-token>
```

## Rate Limiting

- **Limit**: 60 requests per minute per IP address
- **Response on limit exceeded**: HTTP 429 with error message

```json
{
  "error": "Rate limit exceeded. Maximum 60 requests per minute."
}
```

## Request Parameters

All parameters are optional query string parameters:

| Parameter | Type | Validation | Description |
|-----------|------|------------|-------------|
| `q` | string | max 200 chars | Keyword search (make, model, engine, color) |
| `province` | string | 2 chars, uppercase | Canadian province code (AB, BC, ON, etc.) |
| `engine` | string | comma-separated | Engine types: "EV,Hybrid,V6" |
| `seatsMin` | number | 1-20 | Minimum seats |
| `seatsMax` | number | 1-20 | Maximum seats |
| `lat` | number | -90 to 90 | User latitude |
| `lng` | number | -180 to 180 | User longitude |
| `radiusKm` | number | 1-1000 | Search radius in kilometers |
| `sort` | enum | see below | Sort order |
| `offset` | number | >= 0 | Pagination offset (default: 0) |
| `limit` | number | 1-100 | Results per page (default: 20, max: 100) |

### Sort Options

- `relevance` (default)
- `price_asc`
- `price_desc`
- `year_desc`
- `distance_asc` (requires lat/lng)

## Response Schema

### Success Response (200)

```typescript
{
  items: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    engine: string;
    seats: number;
    province: string;
    latitude: number | null;
    longitude: number | null;
    distance_km: number | null;  // Only populated if lat/lng provided
  }>;
  nextOffset: number | null;  // null if no more results
  count: number;              // Number of items in this response
  queryTime: number;          // Query execution time in ms
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "error": "Invalid query parameters",
  "details": {
    "seatsMin": {
      "_errors": ["Number must be greater than or equal to 1"]
    }
  }
}
```

#### 401 - Missing Authorization
```json
{
  "error": "Missing authorization header"
}
```

#### 429 - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded. Maximum 60 requests per minute."
}
```

#### 500 - Server Error
```json
{
  "error": "Database query failed",
  "details": "error message here"
}
```

## Example Requests

### 1. Basic Keyword Search

```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=camry&limit=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 2. Province Filter with Sorting

```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?province=AB&sort=price_asc&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 3. Radius Search (Edmonton, AB)

```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?lat=53.5461&lng=-113.4938&radiusKm=50&sort=distance_asc' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 4. Complex Search with Multiple Filters

```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=toyota&province=AB&engine=Hybrid,EV&seatsMin=5&lat=53.5461&lng=-113.4938&radiusKm=100&sort=price_asc&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 5. Pagination

```bash
# Page 1
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=suv&offset=0&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Page 2 (use nextOffset from previous response)
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=suv&offset=20&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## TypeScript Client Example

```typescript
import { supabase } from '@/integrations/supabase/client';

interface VehicleSearchParams {
  q?: string;
  province?: string;
  engine?: string[];
  seatsMin?: number;
  seatsMax?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'distance_asc';
  offset?: number;
  limit?: number;
}

interface VehicleSearchResult {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engine: string;
  seats: number;
  province: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

interface VehicleSearchResponse {
  items: VehicleSearchResult[];
  nextOffset: number | null;
  count: number;
  queryTime: number;
}

async function searchVehicles(params: VehicleSearchParams): Promise<VehicleSearchResponse> {
  // Build query string
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.set('q', params.q);
  if (params.province) queryParams.set('province', params.province);
  if (params.engine) queryParams.set('engine', params.engine.join(','));
  if (params.seatsMin) queryParams.set('seatsMin', params.seatsMin.toString());
  if (params.seatsMax) queryParams.set('seatsMax', params.seatsMax.toString());
  if (params.lat) queryParams.set('lat', params.lat.toString());
  if (params.lng) queryParams.set('lng', params.lng.toString());
  if (params.radiusKm) queryParams.set('radiusKm', params.radiusKm.toString());
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());

  const { data, error } = await supabase.functions.invoke('vehicles-search', {
    body: null,
    method: 'GET',
  });

  if (error) {
    console.error('Vehicle search error:', error);
    throw error;
  }

  return data as VehicleSearchResponse;
}

// Example usage
const results = await searchVehicles({
  q: 'toyota',
  province: 'AB',
  engine: ['Hybrid', 'EV'],
  seatsMin: 5,
  lat: 53.5461,
  lng: -113.4938,
  radiusKm: 50,
  sort: 'distance_asc',
  limit: 20,
});

console.log(`Found ${results.count} vehicles in ${results.queryTime}ms`);
console.log('Next page offset:', results.nextOffset);
```

## React Hook Example

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

function useVehicleSearch(params: VehicleSearchParams) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => searchVehicles(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Usage in component
function VehicleSearchPage() {
  const [searchParams, setSearchParams] = useState<VehicleSearchParams>({
    limit: 20,
    offset: 0,
  });

  const { data, isLoading, error } = useVehicleSearch(searchParams);

  const handleNextPage = () => {
    if (data?.nextOffset !== null) {
      setSearchParams(prev => ({ ...prev, offset: data.nextOffset }));
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <p>Found {data.count} vehicles (query took {data.queryTime}ms)</p>
          {data.items.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
          {data.nextOffset && (
            <button onClick={handleNextPage}>Load More</button>
          )}
        </>
      )}
    </div>
  );
}
```

## Performance Benchmarks

### Target Response Times

- **Simple keyword search**: < 200ms
- **Province/engine filter**: < 150ms
- **Radius search (with distance calc)**: < 300ms
- **Complex combined search**: < 500ms

### Testing

```bash
# Test response time
time curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=toyota&province=AB' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Load test (requires Apache Bench)
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=suv'
```

## Security Features

✅ **Input Validation**: Zod schema validates all inputs
✅ **Rate Limiting**: 60 requests/minute per IP
✅ **Authentication**: Requires valid JWT token
✅ **RLS Enforcement**: User's JWT passed to RPC for proper access control
✅ **SQL Injection Prevention**: Parameterized queries only
✅ **Type Safety**: TypeScript with strict validation

## CORS Configuration

Currently configured for all origins (`*`). For production, update to specific domains:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Monitoring

Check Edge Function logs for:
- Rate limit violations
- Validation errors
- Query performance (logged as `queryTime`)
- Error patterns

## Next Steps

1. **PROMPT 4**: Build React search UI components
2. **PROMPT 5**: Add geolocation "Near Me" feature
3. **PROMPT 6**: Implement search result caching with React Query

---

**Status**: ✅ COMPLETE  
**Date**: 2025-10-08  
**Endpoint**: `/functions/v1/vehicles-search`  
**Edge Function**: `supabase/functions/vehicles-search/index.ts`
