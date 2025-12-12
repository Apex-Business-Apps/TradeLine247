/**
 * CRITICAL ARCHITECTURAL ISSUE - PRODUCTION BLOCKER
 * ================================================
 *
 * This file attempts to use Twilio credentials in CLIENT-SIDE code,
 * which is a CRITICAL SECURITY VULNERABILITY and won't work at runtime.
 *
 * PROBLEM:
 * - Lines 25-26 access process.env.TWILIO_ACCOUNT_SID and process.env.TWILIO_AUTH_TOKEN
 * - These are SERVER-ONLY environment variables (not prefixed with VITE_)
 * - In the browser, process.env is undefined or doesn't contain these values
 * - Even if they were available, exposing Twilio credentials client-side would be a security risk
 *
 * SOLUTION REQUIRED:
 * 1. Create a Supabase Edge Function for sending RCS messages
 * 2. Move ALL Twilio credential usage to that server-side function
 * 3. This client-side file should only call the edge function via supabase.functions.invoke()
 * 4. The edge function will handle Twilio authentication server-side
 *
 * TEMPORARY MITIGATION:
 * - This code will throw an error at runtime when credentials are undefined
 * - RCS feature is disabled by default via FEATURE_RCS flag
 * - Do NOT enable RCS_ENABLED until this is properly refactored
 */

import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { featureFlags } from '@/config/featureFlags';

export interface RcsOutboundPayload {
  to: string;
  body: string;
  mediaUrls?: string[];
  messagingServiceSid: string;
  statusCallbackUrl?: string;
}

let clientPromise: Promise<any> | undefined;

async function loadClient(): Promise<any> {
  if (clientPromise) return clientPromise;

  clientPromise = import('twilio').then((mod) => {
    const twilioMod = mod as any;
    const twilio = twilioMod.default ?? twilioMod;

    // SECURITY ISSUE: These environment variables are NOT available in browser
    // process.env only works server-side (Node.js/Edge Functions)
    // Client-side Vite only exposes VITE_* prefixed variables via import.meta.env
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // ❌ Will be undefined
    const authToken = process.env.TWILIO_AUTH_TOKEN;   // ❌ Will be undefined

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured for RCS messaging - This code must run server-side');
    }

    return twilio(accountSid, authToken);
  });

  return clientPromise;
}

export async function sendRcsMessage(payload: RcsOutboundPayload): Promise<MessageInstance> {
  if (!featureFlags.RCS_ENABLED) {
    throw new Error('RCS messaging is disabled by FEATURE_RCS flag');
  }

  const { to, body, mediaUrls, messagingServiceSid, statusCallbackUrl } = payload;

  if (!messagingServiceSid) {
    throw new Error('messagingServiceSid is required for RCS messaging');
  }

  const client = await loadClient();
  const payloadForTwilio: Record<string, unknown> = {
    to,
    body,
    messagingServiceSid,
    statusCallback: statusCallbackUrl,
    provideFeedback: true,
  };

  if (mediaUrls && mediaUrls.length > 0) {
    payloadForTwilio.mediaUrl = mediaUrls;
  }

  return client.messages.create(payloadForTwilio);
}
