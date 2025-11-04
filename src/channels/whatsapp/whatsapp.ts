import { featureFlags } from '@/config/featureFlags';

export class WhatsAppDisabledError extends Error {
  readonly status = 501;
  constructor(message = 'WhatsApp messaging is disabled') {
    super(message);
    this.name = 'WhatsAppDisabledError';
  }
}

function assertEnabled(): void {
  if (!featureFlags.WHATSAPP_ENABLED) {
    throw new WhatsAppDisabledError();
  }
}

export interface WhatsAppMessageInput {
  to: string;
  body: string;
}

export async function sendWhatsAppMessage(_input: WhatsAppMessageInput) {
  assertEnabled();
  throw new Error('WhatsApp messaging is not yet implemented');
}

export function isWhatsAppEnabled(): boolean {
  return featureFlags.WHATSAPP_ENABLED;
}
