import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { featureFlags } from '@/config/featureFlags';

export interface RcsOutboundPayload {
  to: string;
  body: string;
  mediaUrls?: string[];
  messagingServiceSid: string;
  statusCallbackUrl?: string;
}

interface TwilioModule {
  default?: (accountSid: string, authToken: string) => any;
  (accountSid: string, authToken: string): any;
}

let clientPromise: Promise<any> | undefined;

async function loadClient(): Promise<any> {
  if (clientPromise) return clientPromise;

  clientPromise = import('twilio').then((mod) => {
    const twilioMod = mod as any;
    const twilio = twilioMod.default ?? twilioMod;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured for RCS messaging');
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
