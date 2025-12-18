// MMS Ingest Webhook - Vision Anchor Entry Point
// Validates Twilio signature, downloads media, stores privately, triggers analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateTwilioRequest } from '../_shared/twilioValidator.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Validate Twilio signature
    const url = new URL(req.url).toString();
    const params = await validateTwilioRequest(req, url);

    const {
      MessageSid,
      From,
      To,
      NumMedia,
      MediaUrl0,
      MediaContentType0,
      CallSid,
      AccountSid
    } = params;

    console.log(`[MMS Ingest] MessageSid: ${MessageSid}, From: ${From}, NumMedia: ${NumMedia}`);

    // Early return if no media
    if (!NumMedia || parseInt(NumMedia) === 0 || !MediaUrl0) {
      console.log('[MMS Ingest] No media attachments, skipping');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Validate content type
    if (!MediaContentType0?.startsWith('image/')) {
      console.warn(`[MMS Ingest] Non-image media type: ${MediaContentType0}`);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Find call_id from CallSid or phone number
    let callId: string | null = null;
    if (CallSid) {
      const { data: callData } = await supabase
        .from('calls')
        .select('id')
        .eq('call_sid', CallSid)
        .single();
      callId = callData?.id || null;
    }

    // If no call found, try to find most recent call from this number
    if (!callId) {
      const { data: recentCall } = await supabase
        .from('calls')
        .select('id')
        .or(`from_number.eq.${From},to_number.eq.${From}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      callId = recentCall?.id || null;
    }

    if (!callId) {
      console.warn(`[MMS Ingest] No call found for ${From}, creating orphan log`);
    }

    // Download media from Twilio (authenticated)
    console.log(`[MMS Ingest] Downloading ${MediaUrl0}`);
    const mediaResponse = await fetch(MediaUrl0, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      }
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.status}`);
    }

    const mediaBlob = await mediaResponse.blob();
    const mediaArrayBuffer = await mediaBlob.arrayBuffer();

    // Deterministic path: {call_id}/{timestamp}_{messageSid}.jpg
    const timestamp = Date.now();
    const extension = MediaContentType0?.split('/')[1] || 'jpg';
    const storagePath = callId
      ? `${callId}/${timestamp}_${MessageSid}.${extension}`
      : `orphan/${timestamp}_${MessageSid}.${extension}`;

    // Upload to private bucket
    console.log(`[MMS Ingest] Uploading to inbound-mms-media/${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from('inbound-mms-media')
      .upload(storagePath, mediaArrayBuffer, {
        contentType: MediaContentType0 || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('[MMS Ingest] Upload failed:', uploadError);
      throw uploadError;
    }

    // Insert visual_analysis_logs row (status: unknown)
    const { data: logData, error: logError } = await supabase
      .from('visual_analysis_logs')
      .insert({
        call_id: callId,
        image_path: storagePath,
        analysis_result: null,
        warranty_status: 'unknown'
      })
      .select('id')
      .single();

    if (logError) {
      console.error('[MMS Ingest] Failed to create log:', logError);
    }

    const analysisLogId = logData?.id;

    // Fire-and-forget: Invoke visual-risk-analyzer
    // Use waitUntil() if available in Deno Deploy, otherwise just invoke async
    if (analysisLogId) {
      console.log(`[MMS Ingest] Triggering visual-risk-analyzer for log ${analysisLogId}`);

      // Async invocation (fire-and-forget)
      fetch(`${SUPABASE_URL}/functions/v1/visual-risk-analyzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          analysis_log_id: analysisLogId,
          call_id: callId,
          image_path: storagePath
        })
      }).catch(err => {
        console.error('[MMS Ingest] Failed to invoke analyzer:', err);
      });
    }

    // Immediately return 200 to Twilio
    console.log(`[MMS Ingest] Success - stored ${storagePath}`);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('[MMS Ingest] Error:', error);

    // Return 200 to Twilio anyway (don't retry webhook)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
      status: 200
    });
  }
});
