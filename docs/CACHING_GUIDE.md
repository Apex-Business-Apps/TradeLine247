# Advanced Caching System Guide

## Overview

The TradeLine 24/7 advanced caching system provides Redis-like functionality with automatic cache warming, TTL management, and intelligent invalidation strategies.

## Architecture

### Cache Storage (`api_cache`)
- **Purpose**: Store frequently accessed data with configurable TTL
- **Features**:
  - Automatic expiration based on TTL
  - Hit/miss tracking for performance monitoring
  - Priority-based retention
  - Tag-based bulk invalidation
  - Type categorization (api, query, computed, static)

### Cache Warming (`cache_warming_config`)
- **Purpose**: Proactively refresh critical data before expiration
- **Features**:
  - Scheduled automatic warming
  - Priority-based execution
  - Success/failure tracking
  - Configurable intervals

### Cache Statistics (`cache_stats`)
- **Purpose**: Monitor cache performance and optimize strategies
- **Metrics**:
  - Hit rate by cache type
  - Size tracking
  - Eviction counts
  - Performance trends

## Edge Functions

### 1. `cache-warmer`
**Purpose**: Proactively warm frequently accessed data

**Invocation**: Scheduled via cron job (recommended: every 5 minutes)

**What it does**:
- Fetches warming configurations due for refresh
- Calls target endpoints to regenerate data
- Stores results in cache with appropriate TTL
- Updates warming statistics
- Cleans up expired entries

**Usage**:
```bash
# Manual trigger
curl -X POST https://your-project.supabase.co/functions/v1/cache-warmer \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response**:
```json
{
  "success": true,
  "warmed": 3,
  "total": 3,
  "cleaned": 12,
  "duration_ms": 1234,
  "results": [
    {
      "config_key": "dashboard_summary",
      "success": true,
      "cached": true,
      "duration_ms": 456
    }
  ]
}
```

### 2. `cache-invalidate`
**Purpose**: Manually invalidate cache entries

**Methods**:
- By specific keys
- By pattern matching
- By tags
- By cache type
- Cleanup expired entries

**Usage**:
```bash
# Invalidate by pattern
curl -X POST https://your-project.supabase.co/functions/v1/cache-invalidate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "dashboard%"
  }'

# Invalidate by tags
curl -X POST https://your-project.supabase.co/functions/v1/cache-invalidate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["user_data", "analytics"]
  }'

# Invalidate specific keys
curl -X POST https://your-project.supabase.co/functions/v1/cache-invalidate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "keys": ["warm:dashboard_summary:{}", "api:calls:list"]
  }'

# Cleanup expired only
curl -X POST https://your-project.supabase.co/functions/v1/cache-invalidate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. `cache-stats`
**Purpose**: Monitor cache performance

**Usage**:
```bash
# Get 7-day statistics (default)
curl https://your-project.supabase.co/functions/v1/cache-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Get 30-day statistics
curl https://your-project.supabase.co/functions/v1/cache-stats?days=30 \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response**:
```json
{
  "success": true,
  "period_days": 7,
  "overall": {
    "total_entries": 45,
    "total_hits": 1234,
    "total_misses": 89,
    "hit_rate": "93.27%",
    "total_size_mb": "2.45"
  },
  "by_type": [
    {
      "cache_type": "api",
      "total_entries": 20,
      "total_hits": 890,
      "hit_rate": "95.12%"
    }
  ],
  "top_entries": [...],
  "warming_status": [...]
}
```

## SQL Functions

### `get_cached_value(cache_key TEXT)`
Retrieve cached value with automatic hit tracking.

```sql
SELECT get_cached_value('dashboard:summary');
```

**Returns**: JSONB value or NULL if expired/not found

### `set_cached_value(...)`
Store value in cache with TTL.

```sql
SELECT set_cached_value(
  p_cache_key := 'api:calls:recent',
  p_value := '{"calls": [...]}'::jsonb,
  p_ttl_seconds := 300,
  p_cache_type := 'api',
  p_priority := 80,
  p_tags := ARRAY['calls', 'recent']
);
```

### `invalidate_cache(...)`
Bulk invalidate cache entries.

```sql
-- Invalidate by pattern
SELECT invalidate_cache(p_pattern := 'dashboard%');

-- Invalidate by tags
SELECT invalidate_cache(p_tags := ARRAY['user_data']);

-- Invalidate by type
SELECT invalidate_cache(p_cache_type := 'api');
```

### `cleanup_expired_cache()`
Remove all expired entries.

```sql
SELECT cleanup_expired_cache();
```

### `get_cache_statistics(days INTEGER)`
Get detailed cache performance metrics.

```sql
SELECT * FROM get_cache_statistics(7);
```

## Cache Warming Configuration

### Add New Warming Config

```sql
INSERT INTO cache_warming_config (
  config_key,
  endpoint,
  params,
  warmup_interval_minutes,
  priority,
  enabled
) VALUES (
  'api_calls_recent',
  '/functions/v1/get-recent-calls',
  '{"limit": 50}'::jsonb,
  5,
  90,
  true
);
```

### Update Warming Interval

```sql
UPDATE cache_warming_config
SET warmup_interval_minutes = 10
WHERE config_key = 'dashboard_summary';
```

### Disable Warming

```sql
UPDATE cache_warming_config
SET enabled = false
WHERE config_key = 'old_endpoint';
```

## Best Practices

### 1. **Choose Appropriate TTL**
- **Critical real-time data**: 30-60 seconds
- **Dashboard data**: 5 minutes
- **Analytics/reports**: 15-30 minutes
- **Static content**: 1-24 hours

### 2. **Set Cache Priority**
- **100**: Critical (dashboard, auth)
- **80**: Important (user data)
- **60**: Standard (lists, queries)
- **40**: Low (computed data)
- **20**: Expendable (static content)

### 3. **Use Tags Effectively**
```typescript
// Group related cache entries
tags: ['user_data', 'profile', 'user_123']

// Allows bulk invalidation
await invalidate({ tags: ['user_123'] }); // Invalidate all user data
```

### 4. **Cache Warming Strategy**
- Warm critical paths (dashboard, landing page)
- Set appropriate intervals (balance freshness vs load)
- Monitor success rates
- Adjust priorities based on usage

### 5. **Invalidation Strategy**
```typescript
// Event-driven invalidation
on('user_update', async (userId) => {
  await invalidate({ tags: [`user_${userId}`] });
});

// Time-based for analytics
on('daily_rollup', async () => {
  await invalidate({ cache_type: 'analytics' });
});
```

## Monitoring

### Check Cache Health
```sql
SELECT * FROM get_cache_statistics(7);
```

### Identify Low-Performing Entries
```sql
SELECT 
  cache_key,
  cache_type,
  hit_count,
  miss_count,
  CASE 
    WHEN (hit_count + miss_count) > 0 
    THEN ROUND((hit_count::NUMERIC / (hit_count + miss_count)) * 100, 2)
    ELSE 0 
  END as hit_rate_pct
FROM api_cache
WHERE (hit_count + miss_count) > 10
ORDER BY hit_rate_pct ASC
LIMIT 20;
```

### Monitor Warming Status
```sql
SELECT 
  config_key,
  success_count,
  failure_count,
  ROUND((success_count::NUMERIC / NULLIF(success_count + failure_count, 0)) * 100, 2) as success_rate,
  last_warmed_at,
  next_warmup_at
FROM cache_warming_config
WHERE enabled = true
ORDER BY priority DESC;
```

## Performance Impact

### Expected Improvements
- **Hit Rate**: Target >90% for critical paths
- **Response Time**: 50-80% reduction for cached queries
- **Database Load**: 60-70% reduction in redundant queries
- **Bandwidth**: 40-50% reduction in duplicate data transfers

### Memory Usage
- **Small cache (<100 entries)**: ~5-10 MB
- **Medium cache (100-500 entries)**: ~25-50 MB
- **Large cache (>500 entries)**: >50 MB (monitor and tune)

## Troubleshooting

### Low Hit Rate
1. Check TTL settings (too short?)
2. Verify warming intervals
3. Review invalidation patterns (too aggressive?)
4. Check query patterns (cache keys consistent?)

### High Memory Usage
1. Review entry count and size
2. Reduce TTL for low-priority items
3. Implement more aggressive cleanup
4. Consider size limits per cache type

### Warming Failures
1. Check endpoint health
2. Verify permissions
3. Review error logs in warming status
4. Test endpoints manually

## Cron Job Setup

Add to `config/prewarm.json` or setup external cron:

```json
{
  "endpoints": [
    "/functions/v1/cache-warmer"
  ],
  "interval_minutes": 5,
  "timeout_ms": 30000
}
```

Or use Supabase Cron (pg_cron):
```sql
SELECT cron.schedule(
  'cache-warmer',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/cache-warmer',
    headers:='{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
  $$
);
```

## Next Steps

1. ✅ Set up cache warming cron job
2. ✅ Monitor cache statistics
3. ✅ Tune TTL and priorities based on usage
4. ✅ Implement event-driven invalidation
5. 🔄 Build cache management dashboard UI
6. 🔄 Add cache warming for user-specific data
7. 🔄 Implement distributed cache for multi-region

## Resources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Cache Warming Best Practices](https://www.fastly.com/blog/cache-warming)
- [TTL Strategies](https://redis.io/docs/manual/eviction/)
