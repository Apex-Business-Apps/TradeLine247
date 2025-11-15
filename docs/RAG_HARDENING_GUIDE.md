# RAG System Hardening Guide

## Overview
The RAG (Retrieval-Augmented Generation) system has been hardened with comprehensive data persistence, versioning, audit logging, and disaster recovery capabilities.

## New Data Persistence Features

### 1. Soft Deletes with Audit Trail
**Table**: `rag_sources` now supports soft deletes
- `deleted_at`: Timestamp when source was deleted
- `version`: Auto-incrementing version number
- `checksum`: Data integrity verification

**Function**: `rag_soft_delete_source(source_id, reason)`
```sql
-- Soft delete a source (preserves data for recovery)
SELECT rag_soft_delete_source(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Outdated content - replaced by newer version'
);
```

**Function**: `rag_restore_source(source_id, reason)`
```sql
-- Restore a previously deleted source
SELECT rag_restore_source(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Customer requested data recovery'
);
```

### 2. Complete Audit History
**Table**: `rag_source_history`
Tracks every change to RAG sources:
- Created
- Updated
- Deleted
- Restored

**Automatic Trigger**: All changes are automatically logged
```sql
-- View complete history of a source
SELECT 
  version,
  change_type,
  changed_by,
  changed_at,
  change_reason,
  title,
  uri
FROM rag_source_history
WHERE source_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY version DESC;
```

### 3. Embedding Backups
**Table**: `rag_embeddings_backup`
Automatic backup before deletion + manual backup support

**Automatic**: Trigger backs up embeddings before deletion
**Manual**: `rag_backup_embeddings(source_id, reason)`

```sql
-- Manually backup embeddings before risky operation
SELECT rag_backup_embeddings(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'pre_update'
);
```

### 4. Ingestion Job Tracking
**Table**: `rag_ingestion_jobs`
Tracks bulk operations with success/failure metrics:
- ingest
- update
- delete
- reindex

```sql
-- Monitor recent ingestion jobs
SELECT 
  job_type,
  status,
  source_count,
  chunk_count,
  embedding_count,
  failed_count,
  started_at,
  completed_at,
  error_message
FROM rag_ingestion_jobs
WHERE status IN ('running', 'failed')
ORDER BY created_at DESC
LIMIT 20;
```

### 5. Health Monitoring
**Table**: `rag_health_metrics`
Real-time health alerts and metrics

**Function**: `rag_health_check()`
```sql
-- Run comprehensive health check
SELECT * FROM rag_health_check();

-- Results include:
-- - total_sources (active vs deleted)
-- - total_chunks (avg per source)
-- - total_embeddings (coverage %)
-- - orphaned_chunks (needs cleanup)
-- - missing_embeddings (needs reprocessing)
-- - data_freshness (last ingestion)
-- - stale_sources (not updated in 30 days)
```

### 6. Query Analytics
**Table**: `rag_query_analytics`
Tracks search performance for optimization:
- query_text & hash
- result_count
- top_score
- execution_time_ms
- filters_applied
- user_id & ip_address

```sql
-- Find slow queries
SELECT 
  query_text,
  COUNT(*) as frequency,
  AVG(execution_time_ms) as avg_ms,
  AVG(result_count) as avg_results
FROM rag_query_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query_text
HAVING AVG(execution_time_ms) > 1000
ORDER BY avg_ms DESC
LIMIT 20;
```

## Maintenance Functions

### Cleanup Orphaned Data
```sql
-- Clean up orphaned chunks and embeddings
SELECT rag_cleanup_orphaned_data();

-- Returns:
-- {
--   "success": true,
--   "chunks_deleted": 42,
--   "embeddings_deleted": 38
-- }
```

### Monitor System Health
```sql
-- Check for unresolved health issues
SELECT 
  metric_name,
  severity,
  details,
  recorded_at,
  EXTRACT(EPOCH FROM (NOW() - recorded_at))/3600 as hours_ago
FROM rag_health_metrics
WHERE resolved_at IS NULL
  AND severity IN ('warning', 'error', 'critical')
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1 
    WHEN 'error' THEN 2 
    WHEN 'warning' THEN 3 
  END,
  recorded_at DESC;
```

## Disaster Recovery Procedures

### Restore Deleted Source
```sql
-- 1. Find deleted sources
SELECT 
  id,
  external_id,
  title,
  deleted_at,
  version
FROM rag_sources
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- 2. Restore source
SELECT rag_restore_source(
  '<source_id>'::uuid,
  'Recovery from accidental deletion'
);

-- 3. Verify restoration
SELECT * FROM rag_source_history
WHERE source_id = '<source_id>'
ORDER BY version DESC
LIMIT 1;
```

### Restore Embeddings from Backup
```sql
-- 1. Find available backups
SELECT 
  b.id,
  b.chunk_id,
  b.backup_reason,
  b.backed_up_at,
  c.text as chunk_text
FROM rag_embeddings_backup b
JOIN rag_chunks c ON b.chunk_id = c.id
WHERE c.source_id = '<source_id>'
  AND b.can_restore = true
ORDER BY b.backed_up_at DESC;

-- 2. Restore embedding (manual process)
INSERT INTO rag_embeddings (chunk_id, embedding)
SELECT chunk_id, embedding
FROM rag_embeddings_backup
WHERE id = '<backup_id>'
ON CONFLICT (chunk_id) DO UPDATE
SET embedding = EXCLUDED.embedding;

-- 3. Mark backup as used
UPDATE rag_embeddings_backup
SET can_restore = false
WHERE id = '<backup_id>';
```

## Performance Optimization

### Analyze Query Patterns
```sql
-- Most common queries
SELECT 
  query_hash,
  query_text,
  COUNT(*) as frequency,
  AVG(result_count) as avg_results,
  AVG(top_score) as avg_relevance
FROM rag_query_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query_hash, query_text
ORDER BY frequency DESC
LIMIT 50;

-- Consider pre-computing answers for high-frequency queries
```

### Monitor Embedding Coverage
```sql
-- Check embedding generation success rate
SELECT 
  COUNT(DISTINCT c.id) as total_chunks,
  COUNT(DISTINCT e.chunk_id) as chunks_with_embeddings,
  (COUNT(DISTINCT e.chunk_id)::FLOAT / COUNT(DISTINCT c.id) * 100)::NUMERIC(5,2) as coverage_pct
FROM rag_chunks c
LEFT JOIN rag_embeddings e ON c.id = e.chunk_id
JOIN rag_sources s ON c.source_id = s.id
WHERE s.deleted_at IS NULL;
```

## Best Practices

### 1. Regular Health Checks
Run `rag_health_check()` daily and alert on warnings/errors

### 2. Backup Before Updates
Always backup embeddings before bulk updates:
```sql
SELECT rag_backup_embeddings(source_id, 'pre_update');
-- ... perform update ...
```

### 3. Monitor Ingestion Jobs
Check for failed jobs and retry:
```sql
SELECT * FROM rag_ingestion_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### 4. Clean Up Periodically
Run cleanup weekly to remove orphaned data:
```sql
SELECT rag_cleanup_orphaned_data();
```

### 5. Archive Old Analytics
Prevent query analytics table bloat:
```sql
-- Archive queries older than 90 days
DELETE FROM rag_query_analytics
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security Considerations

### RLS Policies
All new tables have Row Level Security enabled:
- Service role: Full access
- Authenticated users: Read-only access
- Anonymous users: No access

### Audit Trail
All changes are automatically logged with:
- Timestamp
- Changed by (database user)
- Change reason (when provided)
- Before/after values

### Data Retention
- Source history: Indefinite (compliance)
- Embeddings backup: 90 days (configurable)
- Query analytics: 90 days (privacy)
- Health metrics: Until resolved + 30 days

## Troubleshooting

### Issue: Missing Embeddings
```sql
-- Identify sources with missing embeddings
SELECT 
  s.id,
  s.title,
  COUNT(c.id) as total_chunks,
  COUNT(e.id) as embedded_chunks,
  COUNT(c.id) - COUNT(e.id) as missing_embeddings
FROM rag_sources s
JOIN rag_chunks c ON s.id = c.source_id
LEFT JOIN rag_embeddings e ON c.id = e.chunk_id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.title
HAVING COUNT(c.id) > COUNT(e.id)
ORDER BY missing_embeddings DESC;

-- Solution: Re-run embedding generation via rag-ingest function
```

### Issue: Orphaned Data
```sql
-- Run cleanup
SELECT rag_cleanup_orphaned_data();

-- Verify cleanup
SELECT * FROM rag_health_check()
WHERE check_name = 'orphaned_chunks';
```

### Issue: Performance Degradation
```sql
-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'rag_%'
ORDER BY tablename, indexname;

-- Check table statistics
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'rag_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## API Changes

### Edge Function: rag-ingest
Now automatically creates ingestion job record:
```typescript
// Job tracking added automatically
{
  job_id: "uuid",
  job_type: "ingest",
  status: "completed",
  source_count: 1,
  chunk_count: 42,
  embedding_count: 42
}
```

### Edge Function: rag-search
Now logs query analytics:
```typescript
// Automatically tracked:
{
  query_text: "user search query",
  result_count: 8,
  top_score: 0.92,
  execution_time_ms: 145
}
```

## Migration Impact

### Breaking Changes
None - all changes are additive

### New Columns on rag_sources
- `deleted_at` (nullable) - soft delete support
- `version` (integer, default 1) - version tracking
- `previous_version_id` (uuid, nullable) - version linking
- `checksum` (text, nullable) - data integrity

### Database Size Impact
- +5 new tables
- +12 new indexes
- Estimated 20-30% increase in storage (audit trail)
- History tables will grow over time

## Monitoring Queries

### Daily Health Report
```sql
SELECT 
  'RAG Health Report - ' || CURRENT_DATE as report_date,
  jsonb_pretty(jsonb_object_agg(check_name, 
    jsonb_build_object(
      'status', status,
      'value', metric_value,
      'severity', severity,
      'details', details
    )
  )) as health_summary
FROM rag_health_check();
```

### Weekly Performance Summary
```sql
SELECT 
  'Week of ' || DATE_TRUNC('week', CURRENT_DATE)::date as week,
  COUNT(*) as total_queries,
  AVG(execution_time_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_latency_ms,
  AVG(result_count) as avg_results,
  COUNT(DISTINCT user_id) as unique_users
FROM rag_query_analytics
WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
  AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days';
```

## Support

For issues or questions:
1. Check health metrics: `SELECT * FROM rag_health_check();`
2. Review ingestion jobs: `SELECT * FROM rag_ingestion_jobs WHERE status = 'failed';`
3. Check error logs in Supabase Dashboard
4. Contact engineering team with job_id or source_id for investigation
