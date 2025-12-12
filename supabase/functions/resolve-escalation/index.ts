/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Resolve Escalation
 *
 * Handles resolution of escalated calls and issues
 * with comprehensive audit logging.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";
import { withSecurity, SecurityContext, successResponse, errorResponse, validateRequest } from "../_shared/security-middleware.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ResolveEscalationRequest {
  escalationId: string;
  resolution: 'resolved' | 'escalated';
  resolutionNotes: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

async function handleResolveEscalation(req: Request, ctx: SecurityContext): Promise<Response> {
  const body = await req.json();

  const validation = validateRequest<ResolveEscalationRequest>(body, {
    escalationId: { type: 'uuid', required: true },
    resolution: { type: 'enum', required: true, allowedValues: ['resolved', 'escalated'] },
    resolutionNotes: { type: 'string', required: true, maxLength: 2000 },
    followUpRequired: { type: 'boolean' },
    followUpDate: { type: 'date' },
  });

  if (!validation.isValid) {
    return errorResponse(validation.errors.join(', '), 400, ctx.requestId);
  }

  const data = validation.sanitizedData as ResolveEscalationRequest;

  // Get current escalation
  const { data: escalation, error: fetchError } = await supabase
    .from('escalation_logs')
    .select('*, bookings(*)')
    .eq('id', data.escalationId)
    .single();

  if (fetchError || !escalation) {
    return errorResponse('Escalation not found', 404, ctx.requestId);
  }

  // Verify user has access to this organization
  if (ctx.organizationId && escalation.organization_id !== ctx.organizationId) {
    await enterpriseMonitor.logSecurityEvent('unauthorized_access', {
      resource: 'escalation',
      resource_id: data.escalationId,
      attempted_by: ctx.userId,
    }, ctx.userId, 'high');
    return errorResponse('Access denied', 403, ctx.requestId);
  }

  // Update escalation
  const { error: updateError } = await supabase
    .from('escalation_logs')
    .update({
      status: data.resolution,
      resolution_notes: data.resolutionNotes,
      resolved_by: ctx.userId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.escalationId);

  if (updateError) {
    await enterpriseMonitor.logEvent({
      event_type: 'error',
      severity: 'high',
      component: 'escalation',
      operation: 'resolve_escalation',
      message: `Failed to resolve escalation: ${updateError.message}`,
      metadata: { error: updateError },
      request_id: ctx.requestId,
    });
    return errorResponse('Failed to resolve escalation', 500, ctx.requestId);
  }

  // Log admin action
  await supabase.from('admin_action_log').insert({
    organization_id: escalation.organization_id,
    user_id: ctx.userId,
    action: 'resolve_escalation',
    resource_type: 'escalation',
    resource_id: data.escalationId,
    details: {
      resolution: data.resolution,
      notes: data.resolutionNotes,
      follow_up_required: data.followUpRequired,
      follow_up_date: data.followUpDate,
    },
    success: true,
  });

  // Schedule follow-up if required
  if (data.followUpRequired && data.followUpDate && escalation.booking_id) {
    await supabase.from('booking_confirmations').insert({
      booking_id: escalation.booking_id,
      confirmation_type: 'followup',
      channel: 'both',
      scheduled_for: new Date(data.followUpDate).toISOString(),
      message_content: `Follow-up regarding your recent inquiry. Reference: ${data.escalationId}`,
    });
  }

  await enterpriseMonitor.logEvent({
    event_type: 'info',
    severity: 'medium',
    component: 'escalation',
    operation: 'escalation_resolved',
    message: `Escalation ${data.escalationId} resolved as ${data.resolution}`,
    metadata: {
      escalation_id: data.escalationId,
      resolution: data.resolution,
      resolved_by: ctx.userId,
    },
    request_id: ctx.requestId,
    user_id: ctx.userId,
  });

  return successResponse({
    escalationId: data.escalationId,
    status: data.resolution,
    resolvedAt: new Date().toISOString(),
    resolvedBy: ctx.userId,
  }, 200, ctx.requestId);
}

serve(withSecurity(handleResolveEscalation, {
  endpoint: 'resolve-escalation',
  requireAuth: true,
  rateLimit: 50,
}));
