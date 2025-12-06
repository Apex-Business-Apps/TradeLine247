/**
 * Comprehensive Production Audit Edge Function
 * Performs security, performance, data integrity, and system health checks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight, jsonResponse } from '../_shared/cors.ts';

interface AuditFinding {
  category: 'security' | 'performance' | 'data_integrity' | 'system_health' | 'best_practices';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affected_items?: string[];
  metrics?: Record<string, any>;
}

interface AuditReport {
  timestamp: string;
  overall_health: 'critical' | 'warning' | 'healthy';
  summary: {
    total_findings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findings: AuditFinding[];
  system_metrics: Record<string, any>;
}

async function checkSecurityConfiguration(supabase: any): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  // Check for tables without RLS
  const { data: tablesWithoutRLS } = await supabase.rpc('check_tables_without_rls');
  if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
    findings.push({
      category: 'security',
      severity: 'critical',
      title: 'Tables Without Row Level Security',
      description: `${tablesWithoutRLS.length} tables found without RLS enabled`,
      recommendation: 'Enable RLS on all tables containing user data',
      affected_items: tablesWithoutRLS.map((t: any) => t.tablename)
    });
  }

  // Check encryption health
  const { data: encryptionHealth } = await supabase.rpc('check_encryption_health');
  if (encryptionHealth && encryptionHealth.length > 0) {
    const health = encryptionHealth[0];
    if (health.health_status !== 'HEALTHY') {
      findings.push({
        category: 'security',
        severity: health.health_status.includes('CRITICAL') ? 'critical' : 'high',
        title: 'Encryption Health Issues',
        description: health.health_status,
        recommendation: 'Review and fix encryption issues',
        metrics: {
          total_records: health.total_records,
          encrypted_records: health.encrypted_records,
          failed_records: health.failed_records,
          missing_iv_records: health.missing_iv_records
        }
      });
    }
  }

  // Check for recent security alerts
  const { data: recentAlerts } = await supabase
    .from('security_alerts')
    .select('alert_type, severity, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentAlerts && recentAlerts.length > 0) {
    const criticalAlerts = recentAlerts.filter((a: any) => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      findings.push({
        category: 'security',
        severity: 'critical',
        title: 'Recent Critical Security Alerts',
        description: `${criticalAlerts.length} critical security alerts in the last 24 hours`,
        recommendation: 'Investigate and address security alerts immediately',
        affected_items: criticalAlerts.map((a: any) => a.alert_type),
        metrics: { total_alerts: recentAlerts.length }
      });
    }
  }

  return findings;
}

async function checkPerformance(supabase: any): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  // Check cache effectiveness
  const { data: cacheStats } = await supabase
    .from('cache_stats')
    .select('*')
    .order('stat_date', { ascending: false })
    .limit(1);

  if (cacheStats && cacheStats.length > 0) {
    const stats = cacheStats[0];
    const hitRate = stats.total_hits / (stats.total_hits + stats.total_misses);
    
    if (hitRate < 0.5) {
      findings.push({
        category: 'performance',
        severity: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${(hitRate * 100).toFixed(1)}%`,
        recommendation: 'Review cache warming strategy and increase TTL for frequently accessed data',
        metrics: {
          hit_rate: hitRate,
          total_hits: stats.total_hits,
          total_misses: stats.total_misses
        }
      });
    }
  }

  // Check for slow queries (from analytics events)
  const { data: slowQueries } = await supabase
    .from('analytics_events')
    .select('event_data')
    .eq('event_type', 'slow_query')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(10);

  if (slowQueries && slowQueries.length > 0) {
    findings.push({
      category: 'performance',
      severity: 'high',
      title: 'Slow Queries Detected',
      description: `${slowQueries.length} slow queries detected in the last hour`,
      recommendation: 'Add indexes, optimize queries, or implement caching',
      metrics: { count: slowQueries.length }
    });
  }

  // Check RAG system health
  const { data: ragHealth } = await supabase.rpc('check_rag_health');
  if (ragHealth && ragHealth.length > 0) {
    const health = ragHealth[0];
    if (health.health_status !== 'HEALTHY') {
      findings.push({
        category: 'performance',
        severity: 'medium',
        title: 'RAG System Health Issues',
        description: health.health_status,
        recommendation: 'Review RAG ingestion pipeline and embeddings',
        metrics: {
          total_sources: health.total_sources,
          total_chunks: health.total_chunks,
          total_embeddings: health.total_embeddings,
          chunks_without_embeddings: health.chunks_without_embeddings
        }
      });
    }
  }

  return findings;
}

async function checkDataIntegrity(supabase: any): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  // Check for orphaned appointment events
  const { data: orphanedEvents } = await supabase
    .from('appointment_events')
    .select('id, appointment_id')
    .limit(1000);

  if (orphanedEvents && orphanedEvents.length > 0) {
    const appointmentIds = [...new Set(orphanedEvents.map((e: any) => e.appointment_id))];
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .in('id', appointmentIds);

    const existingIds = new Set(existingAppointments?.map((a: any) => a.id) || []);
    const orphanedCount = orphanedEvents.filter((e: any) => !existingIds.has(e.appointment_id)).length;

    if (orphanedCount > 0) {
      findings.push({
        category: 'data_integrity',
        severity: 'medium',
        title: 'Orphaned Appointment Events',
        description: `${orphanedCount} appointment events reference non-existent appointments`,
        recommendation: 'Clean up orphaned events or add foreign key constraints',
        metrics: { orphaned_count: orphanedCount }
      });
    }
  }

  // Check for missing organization references
  const { data: appointmentsWithoutOrg } = await supabase
    .from('appointments')
    .select('id')
    .is('organization_id', null)
    .limit(100);

  if (appointmentsWithoutOrg && appointmentsWithoutOrg.length > 0) {
    findings.push({
      category: 'data_integrity',
      severity: 'high',
      title: 'Appointments Without Organization',
      description: `${appointmentsWithoutOrg.length} appointments found without organization_id`,
      recommendation: 'All appointments should be associated with an organization',
      metrics: { count: appointmentsWithoutOrg.length }
    });
  }

  // Check for duplicate contacts
  const { data: duplicateContacts } = await supabase.rpc('find_duplicate_contacts');
  if (duplicateContacts && duplicateContacts.length > 0) {
    findings.push({
      category: 'data_integrity',
      severity: 'low',
      title: 'Duplicate Contacts Detected',
      description: `${duplicateContacts.length} duplicate contact records found`,
      recommendation: 'Implement deduplication strategy',
      metrics: { duplicates: duplicateContacts.length }
    });
  }

  return findings;
}

async function checkSystemHealth(supabase: any): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  // Check expired idempotency keys cleanup
  const { data: expiredKeys } = await supabase
    .from('idempotency_keys')
    .select('id')
    .lt('expires_at', new Date().toISOString())
    .limit(1000);

  if (expiredKeys && expiredKeys.length > 100) {
    findings.push({
      category: 'system_health',
      severity: 'low',
      title: 'Excessive Expired Idempotency Keys',
      description: `${expiredKeys.length} expired idempotency keys need cleanup`,
      recommendation: 'Schedule regular cleanup job or reduce TTL',
      metrics: { expired_count: expiredKeys.length }
    });
  }

  // Check rate limit table sizes
  const { data: rateLimitRecords } = await supabase
    .from('hotline_rate_limit_ani')
    .select('id')
    .lt('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  if (rateLimitRecords && rateLimitRecords.length > 500) {
    findings.push({
      category: 'system_health',
      severity: 'low',
      title: 'Stale Rate Limit Records',
      description: `${rateLimitRecords.length} old rate limit records need cleanup`,
      recommendation: 'Run cleanup_hotline_rate_limits() function',
      metrics: { stale_records: rateLimitRecords.length }
    });
  }

  // Check error logs
  const { data: recentErrors } = await supabase
    .from('encryption_errors')
    .select('error_type, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  if (recentErrors && recentErrors.length > 10) {
    findings.push({
      category: 'system_health',
      severity: 'high',
      title: 'High Error Rate',
      description: `${recentErrors.length} errors logged in the last 24 hours`,
      recommendation: 'Investigate root cause of errors',
      metrics: { error_count: recentErrors.length }
    });
  }

  // Check pre-computed answers usage
  const { data: precomputedStats } = await supabase
    .from('rag_precomputed_answers')
    .select('hit_count, enabled, last_hit_at')
    .eq('enabled', true);

  if (precomputedStats && precomputedStats.length > 0) {
    const unusedAnswers = precomputedStats.filter((a: any) => a.hit_count === 0 || !a.last_hit_at);
    const totalHits = precomputedStats.reduce((sum: number, a: any) => sum + (a.hit_count || 0), 0);
    
    findings.push({
      category: 'system_health',
      severity: 'info',
      title: 'Pre-computed Answers Status',
      description: `${precomputedStats.length} active pre-computed answers with ${totalHits} total hits`,
      recommendation: unusedAnswers.length > 0 ? 'Review and disable unused pre-computed answers' : 'Pre-computed answers are being utilized effectively',
      metrics: {
        total_answers: precomputedStats.length,
        unused_answers: unusedAnswers.length,
        total_hits: totalHits,
        avg_hits: totalHits / precomputedStats.length
      }
    });
  }

  return findings;
}

async function checkBestPractices(supabase: any): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  // Check for missing indexes
  const { data: missingIndexes } = await supabase.rpc('identify_missing_indexes');
  if (missingIndexes && missingIndexes.length > 0) {
    findings.push({
      category: 'best_practices',
      severity: 'medium',
      title: 'Missing Database Indexes',
      description: `${missingIndexes.length} tables may benefit from additional indexes`,
      recommendation: 'Add indexes on frequently queried columns',
      affected_items: missingIndexes.map((t: any) => t.table_name)
    });
  }

  // Check audit log retention
  const { data: oldAuditLogs } = await supabase
    .from('audit_logs')
    .select('id')
    .lt('ts', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  if (oldAuditLogs && oldAuditLogs.length > 100) {
    findings.push({
      category: 'best_practices',
      severity: 'low',
      title: 'Old Audit Logs',
      description: `${oldAuditLogs.length} audit logs older than 90 days`,
      recommendation: 'Archive or delete old audit logs per retention policy',
      metrics: { old_logs_count: oldAuditLogs.length }
    });
  }

  // Check cache warming configuration
  const { data: cacheWarming } = await supabase
    .from('cache_warming_config')
    .select('*')
    .eq('enabled', true);

  if (!cacheWarming || cacheWarming.length === 0) {
    findings.push({
      category: 'best_practices',
      severity: 'low',
      title: 'No Cache Warming Configured',
      description: 'No active cache warming configurations found',
      recommendation: 'Configure cache warming for frequently accessed endpoints',
      metrics: { configured_endpoints: 0 }
    });
  }

  return findings;
}

async function handleRequest(req: Request): Promise<Response> {
  const pf = preflight(req);
  if (pf) return pf;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting comprehensive production audit...');
    const startTime = Date.now();

    // Run all audit checks in parallel
    const [
      securityFindings,
      performanceFindings,
      dataIntegrityFindings,
      systemHealthFindings,
      bestPracticesFindings
    ] = await Promise.all([
      checkSecurityConfiguration(supabase),
      checkPerformance(supabase),
      checkDataIntegrity(supabase),
      checkSystemHealth(supabase),
      checkBestPractices(supabase)
    ]);

    const allFindings = [
      ...securityFindings,
      ...performanceFindings,
      ...dataIntegrityFindings,
      ...systemHealthFindings,
      ...bestPracticesFindings
    ];

    // Calculate summary
    const summary = {
      total_findings: allFindings.length,
      critical: allFindings.filter(f => f.severity === 'critical').length,
      high: allFindings.filter(f => f.severity === 'high').length,
      medium: allFindings.filter(f => f.severity === 'medium').length,
      low: allFindings.filter(f => f.severity === 'low').length,
      info: allFindings.filter(f => f.severity === 'info').length
    };

    // Determine overall health
    let overallHealth: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (summary.critical > 0) {
      overallHealth = 'critical';
    } else if (summary.high > 0 || summary.medium > 3) {
      overallHealth = 'warning';
    }

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      overall_health: overallHealth,
      summary,
      findings: allFindings.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      system_metrics: {
        audit_duration_ms: Date.now() - startTime,
        checks_performed: 5,
        timestamp: new Date().toISOString()
      }
    };

    // Log audit completion
    await supabase.from('analytics_events').insert({
      event_type: 'production_audit_completed',
      event_data: {
        overall_health: overallHealth,
        total_findings: summary.total_findings,
        critical: summary.critical,
        high: summary.high
      },
      severity: overallHealth === 'critical' ? 'error' : overallHealth === 'warning' ? 'warn' : 'info'
    });

    console.log(`Production audit completed: ${overallHealth} (${summary.total_findings} findings)`);

    return jsonResponse({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error in production-audit:', error);
    return jsonResponse(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

Deno.serve(handleRequest);
