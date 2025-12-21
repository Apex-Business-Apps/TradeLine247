/**
 * vision_anchor.ts - MMS Visual Analysis with Private Storage + Async Analysis
 *
 * CRITICAL: NO top-level https:// imports for Node ESM compatibility.
 * Uses factory pattern for runtime dependencies.
 *
 * Features:
 * - Private bucket storage for inbound MMS media
 * - Signed URL generation with TTL
 * - Async analysis scheduling (non-blocking)
 * - Warranty gatekeeper with risk detection
 */

// ============================================================================
// TYPES
// ============================================================================

/** Media metadata for storage */
export interface MediaMetadata {
  call_id?: string;
  call_sid?: string;
  from_number?: string;
  content_type: string;
  file_size_bytes?: number;
  original_url?: string;  // DO NOT STORE - only for reference
  source: 'mms' | 'upload' | 'api';
}

/** Visual analysis result */
export interface VisualAnalysisResult {
  brand?: string;
  model?: string;
  est_age_years?: number;
  visible_risks?: string[];
  confidence: number;
  warranty_status?: 'valid' | 'expired' | 'unknown';
  warranty_warning?: string;
  raw_analysis?: Record<string, unknown>;
}

/** Warranty rule from database */
export interface WarrantyRule {
  brand_name: string;
  max_warranty_years: number;
  warning_message: string;
}

/** Vision anchor storage result */
export interface StorageResult {
  storage_key: string;
  bucket: string;
  content_type: string;
  size_bytes: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Private bucket name for MMS media */
export const MMS_BUCKET = 'inbound-mms-media';

/** Default signed URL TTL in seconds */
export const DEFAULT_SIGNED_URL_TTL = 3600; // 1 hour

/** Warranty risk keywords (loaded from env or defaults) */
export const DEFAULT_WARRANTY_RISK_KEYWORDS = [
  'old',
  'rust',
  'corroded',
  'damaged',
  'worn',
  'cracked',
  'leaking',
  'vintage',
  'antique',
  'outdated'
];

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique storage key for media
 */
export function generateStorageKey(
  callId: string,
  contentType: string,
  timestamp?: Date
): string {
  const ts = timestamp || new Date();
  const datePrefix = ts.toISOString().split('T')[0].replace(/-/g, '/');
  const extension = getExtensionFromMimeType(contentType);
  const uniqueId = crypto.randomUUID().slice(0, 8);

  return `${datePrefix}/${callId}/${uniqueId}.${extension}`;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'application/pdf': 'pdf'
  };

  return mimeMap[mimeType] || 'bin';
}

/**
 * Check for warranty risk keywords in analysis text
 */
export function detectWarrantyRiskKeywords(
  text: string,
  keywords?: string[]
): string[] {
  const checkKeywords = keywords || DEFAULT_WARRANTY_RISK_KEYWORDS;
  const lowerText = text.toLowerCase();

  return checkKeywords.filter(kw => lowerText.includes(kw.toLowerCase()));
}

/**
 * Estimate equipment age from brand and model (heuristic)
 */
export function estimateEquipmentAge(
  brand: string,
  model?: string
): { est_age_years: number | null; confidence: number } {
  // This is a placeholder - production should use manufacturer databases
  // For now, return null with low confidence
  return {
    est_age_years: null,
    confidence: 0.1
  };
}

/**
 * Check warranty status based on rules
 */
export function checkWarrantyStatus(
  brand: string,
  estAgeYears: number | null,
  rules: WarrantyRule[]
): { status: 'valid' | 'expired' | 'unknown'; warning?: string } {
  if (!estAgeYears) {
    return { status: 'unknown' };
  }

  const rule = rules.find(
    r => r.brand_name.toLowerCase() === brand.toLowerCase()
  );

  if (!rule) {
    return { status: 'unknown' };
  }

  if (estAgeYears > rule.max_warranty_years) {
    return {
      status: 'expired',
      warning: rule.warning_message
    };
  }

  return { status: 'valid' };
}

// ============================================================================
// RUNTIME SERVICE FACTORY
// ============================================================================

/**
 * Create vision anchor service with runtime dependencies
 */
export function createVisionAnchorService(supabaseClient: {
  storage: {
    from: (bucket: string) => {
      upload: (path: string, data: Blob | ArrayBuffer, options?: Record<string, unknown>) => Promise<{ data: { path: string } | null; error: unknown }>;
      createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
      remove: (paths: string[]) => Promise<{ data: unknown; error: unknown }>;
    };
  };
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    update: (data: Record<string, unknown>) => { eq: (col: string, val: unknown) => Promise<{ data: unknown; error: unknown }> };
    select: (columns?: string) => {
      eq: (col: string, val: unknown) => Promise<{ data: unknown[]; error: unknown }>;
    };
  };
}) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required for vision anchor service');
  }

  // Load warranty risk keywords from env if available
  const envKeywords = typeof Deno !== 'undefined'
    ? Deno.env.get('WARRANTY_RISK_KEYWORDS')
    : undefined;
  const warrantyRiskKeywords = envKeywords
    ? envKeywords.split(',').map(k => k.trim())
    : DEFAULT_WARRANTY_RISK_KEYWORDS;

  return {
    /**
     * Store incoming media in private bucket
     * NEVER stores the original public URL
     */
    async storeIncomingMedia(
      buffer: ArrayBuffer | Blob,
      metadata: MediaMetadata
    ): Promise<StorageResult | { error: string }> {
      try {
        const storageKey = generateStorageKey(
          metadata.call_id || metadata.call_sid || 'unknown',
          metadata.content_type
        );

        const { data, error } = await supabaseClient.storage
          .from(MMS_BUCKET)
          .upload(storageKey, buffer, {
            contentType: metadata.content_type,
            upsert: false,
            cacheControl: '3600'
          });

        if (error) {
          console.error('Vision anchor storage error:', error);
          return { error: String(error) };
        }

        // Log the storage event
        await supabaseClient.from('visual_analysis_logs').insert({
          call_id: metadata.call_id,
          image_path: storageKey,
          created_at: new Date().toISOString()
        });

        return {
          storage_key: data?.path || storageKey,
          bucket: MMS_BUCKET,
          content_type: metadata.content_type,
          size_bytes: buffer instanceof Blob ? buffer.size : buffer.byteLength
        };
      } catch (err) {
        console.error('storeIncomingMedia error:', err);
        return { error: String(err) };
      }
    },

    /**
     * Generate a signed URL for secure access
     * URL expires after TTL seconds
     */
    async generateSignedUrl(
      storageKey: string,
      ttlSeconds = DEFAULT_SIGNED_URL_TTL
    ): Promise<{ signedUrl: string } | { error: string }> {
      try {
        const { data, error } = await supabaseClient.storage
          .from(MMS_BUCKET)
          .createSignedUrl(storageKey, ttlSeconds);

        if (error || !data?.signedUrl) {
          return { error: String(error || 'Failed to generate signed URL') };
        }

        return { signedUrl: data.signedUrl };
      } catch (err) {
        console.error('generateSignedUrl error:', err);
        return { error: String(err) };
      }
    },

    /**
     * Invoke async analysis - non-blocking, schedules job
     * Returns immediately, analysis runs in background
     */
    async invokeAsyncAnalysis(
      storageKey: string,
      callId: string,
      options?: {
        notifyOnWarrantyRisk?: boolean;
        ownerEmail?: string;
      }
    ): Promise<{ queued: boolean; job_id?: string; error?: string }> {
      try {
        // In production, this would enqueue a job to a queue (twilio_job_queue or similar)
        // For now, we mark the analysis as pending in the logs table

        const { error } = await supabaseClient.from('visual_analysis_logs')
          .update({
            analysis_result: { status: 'pending', queued_at: new Date().toISOString() },
            warranty_status: 'unknown'
          })
          .eq('image_path', storageKey);

        if (error) {
          console.error('Failed to queue analysis:', error);
          return { queued: false, error: String(error) };
        }

        // Store notification preferences for when analysis completes
        if (options?.notifyOnWarrantyRisk && options?.ownerEmail) {
          await supabaseClient.from('visual_analysis_logs')
            .update({
              analysis_result: {
                status: 'pending',
                queued_at: new Date().toISOString(),
                notify_on_warranty_risk: true,
                notify_email: options.ownerEmail
              }
            })
            .eq('image_path', storageKey);
        }

        return {
          queued: true,
          job_id: `va_${callId}_${Date.now()}`
        };
      } catch (err) {
        console.error('invokeAsyncAnalysis error:', err);
        return { queued: false, error: String(err) };
      }
    },

    /**
     * Process analysis result and check for warranty risks
     * Called by async worker when analysis completes
     */
    async processAnalysisResult(
      storageKey: string,
      analysisResult: VisualAnalysisResult
    ): Promise<{ processed: boolean; warranty_risk: boolean; error?: string }> {
      try {
        // Get warranty rules from database
        const { data: rules } = await supabaseClient.from('warranty_rules')
          .select('*');

        const warrantyRules = (rules || []) as WarrantyRule[];

        // Check for warranty risk keywords in visible_risks
        const riskKeywords = analysisResult.visible_risks
          ? detectWarrantyRiskKeywords(
              analysisResult.visible_risks.join(' '),
              warrantyRiskKeywords
            )
          : [];

        // Check warranty status
        const warrantyCheck = analysisResult.brand
          ? checkWarrantyStatus(
              analysisResult.brand,
              analysisResult.est_age_years || null,
              warrantyRules
            )
          : { status: 'unknown' as const };

        const hasWarrantyRisk =
          warrantyCheck.status === 'expired' ||
          riskKeywords.length > 0 ||
          (analysisResult.est_age_years && analysisResult.est_age_years > 5);

        // Update analysis log with results
        await supabaseClient.from('visual_analysis_logs')
          .update({
            analysis_result: {
              ...analysisResult,
              detected_risk_keywords: riskKeywords,
              status: 'completed'
            },
            warranty_status: warrantyCheck.status,
            warranty_warning: warrantyCheck.warning || (hasWarrantyRisk ? 'Potential warranty risk detected' : null),
            analyzed_at: new Date().toISOString()
          })
          .eq('image_path', storageKey);

        return {
          processed: true,
          warranty_risk: hasWarrantyRisk
        };
      } catch (err) {
        console.error('processAnalysisResult error:', err);
        return { processed: false, warranty_risk: false, error: String(err) };
      }
    },

    /**
     * Delete media from private storage
     * For GDPR/DSAR compliance
     */
    async deleteMedia(storageKey: string): Promise<{ deleted: boolean; error?: string }> {
      try {
        const { error } = await supabaseClient.storage
          .from(MMS_BUCKET)
          .remove([storageKey]);

        if (error) {
          return { deleted: false, error: String(error) };
        }

        return { deleted: true };
      } catch (err) {
        return { deleted: false, error: String(err) };
      }
    }
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Constants
  MMS_BUCKET,
  DEFAULT_SIGNED_URL_TTL,
  DEFAULT_WARRANTY_RISK_KEYWORDS,
  // Pure utilities
  generateStorageKey,
  getExtensionFromMimeType,
  detectWarrantyRiskKeywords,
  estimateEquipmentAge,
  checkWarrantyStatus,
  // Factory
  createVisionAnchorService
};
