/**
 * One-Click Consent Export for Regulatory Compliance
 * Generates CASL, PIPEDA, TCPA, GDPR proof packages
 */

import { supabase } from '@/integrations/supabase/client';
import { telemetry } from '@/lib/observability/telemetry';

interface ConsentRecord {
  id: string;
  profile_id: string | null;
  lead_id: string | null;
  type: string;
  status: string;
  jurisdiction: string;
  purpose: string;
  granted_at: string | null;
  withdrawn_at: string | null;
  expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  channel: string | null;
  proof_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ExportOptions {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  jurisdiction?: string;
  format: 'csv' | 'json' | 'pdf';
}

export class ConsentExporter {
  /**
   * Generate one-click regulatory export
   */
  async exportConsents(options: ExportOptions): Promise<Blob> {
    const startTime = performance.now();
    
    try {
      telemetry.info('Starting consent export', {
        organizationId: options.organizationId,
        format: options.format,
      });

      // Fetch consent records with related data
      const { data: consents, error } = await supabase
        .from('consents')
        .select(`
          *,
          profiles:profile_id (
            id,
            email,
            full_name
          ),
          leads:lead_id (
            id,
            email,
            first_name,
            last_name,
            dealership_id
          )
        `)
        .gte('created_at', options.startDate?.toISOString() || '2000-01-01')
        .lte('created_at', options.endDate?.toISOString() || new Date().toISOString());

      if (error) {
        telemetry.error('Failed to fetch consent records', {
          organizationId: options.organizationId,
          error: error.message,
        });
        throw error;
      }

      const records = consents as unknown as ConsentRecord[];

      // Generate export based on format
      let blob: Blob;
      
      switch (options.format) {
        case 'csv':
          blob = this.generateCSV(records);
          break;
        case 'json':
          blob = this.generateJSON(records);
          break;
        case 'pdf':
          // TODO: Implement PDF generation with jspdf
          blob = this.generateCSV(records); // Fallback to CSV for now
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      const duration = performance.now() - startTime;
      telemetry.trackPerformance('consent_export', duration, {
        organizationId: options.organizationId,
        recordCount: records.length,
        format: options.format,
      });

      telemetry.info('Consent export completed', {
        organizationId: options.organizationId,
        recordCount: records.length,
        format: options.format,
        durationMs: Math.round(duration),
      });

      return blob;
    } catch (error) {
      telemetry.error('Consent export failed', {
        organizationId: options.organizationId,
      }, error as Error);
      throw error;
    }
  }

  private generateCSV(records: ConsentRecord[]): Blob {
    const headers = [
      'ID',
      'Contact Email',
      'Contact Name',
      'Consent Type',
      'Status',
      'Jurisdiction',
      'Purpose',
      'Granted At',
      'Withdrawn At',
      'Expires At',
      'IP Address',
      'User Agent',
      'Channel',
      'Proof URL',
      'Created At',
    ];

    const rows = records.map(record => [
      record.id,
      (record as any).profiles?.email || (record as any).leads?.email || 'N/A',
      (record as any).profiles?.full_name || 
        `${(record as any).leads?.first_name || ''} ${(record as any).leads?.last_name || ''}`.trim() || 'N/A',
      record.type,
      record.status,
      record.jurisdiction,
      record.purpose,
      record.granted_at || 'N/A',
      record.withdrawn_at || 'N/A',
      record.expires_at || 'N/A',
      record.ip_address || 'N/A',
      record.user_agent || 'N/A',
      record.channel || 'N/A',
      record.proof_url || 'N/A',
      record.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private generateJSON(records: ConsentRecord[]): Blob {
    const exportData = {
      exportDate: new Date().toISOString(),
      recordCount: records.length,
      consents: records,
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
  }

  /**
   * Validate consent completeness for regulatory requirements
   */
  validateConsentProof(record: ConsentRecord): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Required fields for CASL/TCPA/GDPR compliance
    if (!record.granted_at) missing.push('granted_at');
    if (!record.ip_address) warnings.push('ip_address');
    if (!record.user_agent) warnings.push('user_agent');
    if (!record.channel) warnings.push('channel');
    if (!record.purpose) missing.push('purpose');

    // Jurisdiction-specific checks
    if (record.jurisdiction.startsWith('ca_')) {
      // CASL requirements
      if (record.type === 'marketing' && !record.proof_url) {
        warnings.push('proof_url_recommended_for_casl');
      }
    }

    if (record.jurisdiction === 'us') {
      // TCPA requirements
      if (record.type === 'sms_marketing' && !record.granted_at) {
        missing.push('explicit_timestamp_required_for_tcpa');
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }
}

export const consentExporter = new ConsentExporter();
