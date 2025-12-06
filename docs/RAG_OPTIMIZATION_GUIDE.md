# RAG Performance Optimization & Backup Guide

## Overview
This guide covers the automated optimization and backup tools for the RAG system, including performance analysis, pre-computed answer recommendations, index optimization, and automated backups.

## Edge Functions

### 1. rag-optimize
Analyzes RAG performance and provides actionable optimization recommendations.

**Endpoint**: `supabase.functions.invoke('rag-optimize', { body: {...} })`

#### Actions

##### Full Report (Default)
Generates comprehensive optimization report including slow queries, pre-compute recommendations, and index analysis.

```typescript
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: {
    action: 'full_report',
    days: 7,           // Analysis period
    threshold_ms: 500  // Slow query threshold
  }
});

// Response includes:
// - slow_query_analysis
// - precomputed_recommendations
// - index_optimization
// - executive_summary
```

##### Analyze Slow Queries
Identifies and groups slow queries by pattern.

```typescript
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: {
    action: 'analyze_slow_queries',
    days: 7,
    threshold_ms: 500
  }
});

// Returns:
// - total_slow_queries
// - unique_patterns
// - queries (with frequency, avg time, etc.)
// - recommendations
```

##### Recommend Pre-computed Answers
Identifies high-frequency queries that should be pre-computed.

```typescript
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: {
    action: 'recommend_precomputed',
    days: 30  // Longer period for frequency analysis
  }
});

// Returns queries with:
// - frequency
// - avg_execution_time_ms
// - precompute_score (higher = better candidate)
// - estimated_savings_ms
```

##### Optimize Indexes
Checks index health and provides maintenance recommendations.

```typescript
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: {
    action: 'optimize_indexes'
  }
});

// Returns:
// - health_status
// - recommendations (with severity and SQL)
// - summary
```

### 2. rag-backup-automated
Automated backup system for RAG sources, chunks, and embeddings.

**Endpoint**: `supabase.functions.invoke('rag-backup-automated', { body: {...} })`

#### Backup Modes

##### Full Backup
Backs up all active sources.

```typescript
const { data } = await supabase.functions.invoke('rag-backup-automated', {
  body: {
    mode: 'all',
    backup_reason: 'daily_automated_backup',
    cleanup_old: true  // Optional: removes backups >90 days
  }
});
```

##### Recent Sources
Backs up sources modified in the last N hours.

```typescript
const { data } = await supabase.functions.invoke('rag-backup-automated', {
  body: {
    mode: 'recent',
    hours: 24,
    backup_reason: 'hourly_backup'
  }
});
```

##### Specific Sources
Backs up selected sources by ID.

```typescript
const { data } = await supabase.functions.invoke('rag-backup-automated', {
  body: {
    mode: 'specific',
    source_ids: [
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001'
    ],
    backup_reason: 'pre_update_backup'
  }
});
```

## Optimization Workflows

### Daily Performance Check
```typescript
// Run daily to monitor RAG performance
async function dailyOptimizationCheck() {
  const { data } = await supabase.functions.invoke('rag-optimize', {
    body: { action: 'full_report', days: 1 }
  });
  
  // Alert if high-priority issues found
  if (data.executive_summary.high_priority_issues > 0) {
    console.warn('High priority RAG issues detected:', data);
    // Send notification to ops team
  }
  
  return data;
}
```

### Weekly Pre-compute Analysis
```typescript
// Run weekly to identify candidates for pre-computation
async function weeklyPrecomputeAnalysis() {
  const { data } = await supabase.functions.invoke('rag-optimize', {
    body: { 
      action: 'recommend_precomputed',
      days: 7
    }
  });
  
  // Filter high-value candidates
  const highPriority = data.recommendations
    .filter(r => r.frequency > 10 && r.avg_execution_time_ms > 300)
    .slice(0, 10);
  
  console.log('Top pre-compute candidates:', highPriority);
  
  // TODO: Implement pre-compute storage table
  // Store these answers in a cache table for instant retrieval
  
  return highPriority;
}
```

### Index Maintenance
```typescript
// Run monthly for index health
async function monthlyIndexMaintenance() {
  const { data } = await supabase.functions.invoke('rag-optimize', {
    body: { action: 'optimize_indexes' }
  });
  
  // Execute high-severity recommendations
  for (const rec of data.recommendations) {
    if (rec.severity === 'high' && rec.sql) {
      console.log('Executing:', rec.action);
      // Execute maintenance SQL through Supabase dashboard
      // or via RPC if safe
    }
  }
  
  return data;
}
```

## Backup Workflows

### Automated Daily Backup
```typescript
// Set up as cron job or scheduled task
async function dailyBackup() {
  const { data } = await supabase.functions.invoke('rag-backup-automated', {
    body: {
      mode: 'recent',
      hours: 24,
      backup_reason: 'daily_automated_backup',
      cleanup_old: true  // Clean up backups >90 days
    }
  });
  
  console.log('Daily backup complete:', data.backup);
  console.log('Backup stats:', data.stats);
  
  // Alert if errors occurred
  if (data.backup.errors > 0) {
    console.error('Backup errors detected:', data.backup.errors);
  }
  
  return data;
}
```

### Pre-Update Backup
```typescript
// Always backup before major updates
async function preUpdateBackup(sourceIds: string[]) {
  const { data } = await supabase.functions.invoke('rag-backup-automated', {
    body: {
      mode: 'specific',
      source_ids: sourceIds,
      backup_reason: 'pre_update_backup'
    }
  });
  
  if (!data.success || data.backup.errors > 0) {
    throw new Error('Backup failed - aborting update');
  }
  
  console.log('Pre-update backup successful:', data.backup);
  return data;
}
```

### Full System Backup
```typescript
// Weekly full backup for disaster recovery
async function weeklyFullBackup() {
  const { data } = await supabase.functions.invoke('rag-backup-automated', {
    body: {
      mode: 'all',
      backup_reason: 'weekly_full_backup',
      cleanup_old: false  // Keep all full backups
    }
  });
  
  console.log('Full backup complete:', data);
  
  // Store backup metadata for recovery procedures
  await supabase.from('backup_audit_log').insert({
    backup_type: 'full',
    sources_count: data.backup.sources_backed_up,
    embeddings_count: data.backup.embeddings_backed_up,
    timestamp: data.timestamp
  });
  
  return data;
}
```

## Scheduling Recommendations

### Cron-style Schedule
```typescript
// Example scheduling setup (pseudo-code)

// Every hour: Backup recent changes
schedule('0 * * * *', async () => {
  await supabase.functions.invoke('rag-backup-automated', {
    body: { mode: 'recent', hours: 1 }
  });
});

// Every day at 2 AM: Full optimization report
schedule('0 2 * * *', async () => {
  const report = await supabase.functions.invoke('rag-optimize', {
    body: { action: 'full_report', days: 1 }
  });
  // Email report to ops team
});

// Every Sunday at 3 AM: Full backup + cleanup
schedule('0 3 * * 0', async () => {
  await supabase.functions.invoke('rag-backup-automated', {
    body: { mode: 'all', cleanup_old: true }
  });
});

// Every Monday at 9 AM: Weekly pre-compute analysis
schedule('0 9 * * 1', async () => {
  await supabase.functions.invoke('rag-optimize', {
    body: { action: 'recommend_precomputed', days: 7 }
  });
});
```

## Performance Benchmarks

### Target Metrics
- **Query Latency**: <200ms for 95th percentile
- **Cache Hit Rate**: >80% for pre-computed queries
- **Embedding Coverage**: 100% (no missing embeddings)
- **Backup Frequency**: Hourly for recent, daily full
- **Backup Retention**: 90 days (configurable)

### Monitoring Query
```sql
-- Weekly performance summary
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_queries,
  AVG(execution_time_ms) as avg_latency,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_latency,
  AVG(result_count) as avg_results
FROM rag_query_analytics
WHERE created_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```

## Troubleshooting

### High Latency Queries
```typescript
// Identify and fix slow queries
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: {
    action: 'analyze_slow_queries',
    threshold_ms: 200,  // Lower threshold
    days: 1
  }
});

// For each slow query:
// 1. Check if it's a candidate for pre-compute
// 2. Review filters and query complexity
// 3. Check embedding quality for low-score results
// 4. Consider query reformulation
```

### Backup Failures
```typescript
// Check backup stats
const { data } = await supabase.functions.invoke('rag-backup-automated', {
  body: { mode: 'recent', hours: 0 }  // Just get stats
});

console.log('Backup health:', data.stats);

// If backups are failing:
// 1. Check disk space
// 2. Review error logs in Supabase dashboard
// 3. Verify rag_backup_embeddings function exists
// 4. Check RLS policies on rag_embeddings_backup table
```

### Missing Embeddings
```typescript
// Check for sources with missing embeddings
const { data } = await supabase.functions.invoke('rag-optimize', {
  body: { action: 'optimize_indexes' }
});

// If missing_embeddings found:
const missingIssue = data.recommendations
  .find(r => r.type === 'missing_embeddings');

if (missingIssue) {
  console.log('SQL to find affected sources:', missingIssue.sql);
  // Re-run embedding generation via rag-ingest
}
```

## Integration with Frontend

### React Hook Example
```typescript
// src/hooks/useRagOptimization.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRagOptimization() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('rag-optimize', {
        body: { action: 'full_report', days: 7 }
      });
      setReport(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const runBackup = async (mode: 'all' | 'recent' | 'specific') => {
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('rag-backup-automated', {
        body: { mode, hours: 24, cleanup_old: true }
      });
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, report, generateReport, runBackup };
}
```

## Best Practices

### 1. Always Backup Before Updates
```typescript
async function safeUpdateSource(sourceId: string, updates: any) {
  // Backup first
  await supabase.functions.invoke('rag-backup-automated', {
    body: {
      mode: 'specific',
      source_ids: [sourceId],
      backup_reason: 'pre_update'
    }
  });
  
  // Then update
  const { error } = await supabase
    .from('rag_sources')
    .update(updates)
    .eq('id', sourceId);
  
  if (error) {
    console.error('Update failed - backup available for recovery');
    throw error;
  }
}
```

### 2. Regular Performance Reviews
- Run optimization reports weekly
- Review slow queries daily
- Update pre-computed answers monthly
- Monitor backup success rates

### 3. Progressive Optimization
- Start with high-frequency, high-latency queries
- Implement top 5 pre-compute candidates first
- Monitor impact before expanding
- A/B test pre-computed vs. real-time results

### 4. Backup Verification
```typescript
// Periodically verify backup integrity
async function verifyBackups() {
  const { data } = await supabase
    .from('rag_embeddings_backup')
    .select('id, chunk_id, backed_up_at')
    .order('backed_up_at', { ascending: false })
    .limit(100);
  
  // Check that backups exist and are recent
  const latestBackup = data?.[0]?.backed_up_at;
  const hoursSinceBackup = latestBackup 
    ? (Date.now() - new Date(latestBackup).getTime()) / (1000 * 60 * 60)
    : Infinity;
  
  if (hoursSinceBackup > 24) {
    console.error('WARNING: No backups in last 24 hours!');
  }
  
  return { latestBackup, hoursSinceBackup, totalBackups: data?.length };
}
```

## Support

For optimization and backup issues:
1. Run full report: `rag-optimize` with `action: 'full_report'`
2. Check backup stats: `rag-backup-automated` with `mode: 'recent', hours: 0`
3. Review logs in Supabase Dashboard → Edge Functions
4. Check query analytics: `SELECT * FROM rag_query_analytics ORDER BY created_at DESC LIMIT 100`
5. Contact engineering with function logs and error details
