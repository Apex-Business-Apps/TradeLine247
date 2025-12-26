/**
 * Centralized AI Response Template System
 *
 * Purpose: Consistent, safe, maintainable response templates for call handling
 *
 * Design Principles:
 * - Standardized placeholders: {variable_name} (lowercase_snake_case)
 * - Safe fallback values (never produce "undefined", "null", "NaN")
 * - Centralized source of truth for all spoken/TwiML responses
 * - Apple-level polish: warm, concise, professional
 *
 * Usage:
 *   import { renderTemplate, TEMPLATES } from "../_shared/responseTemplates.ts";
 *   const greeting = renderTemplate(TEMPLATES.GREETING, { business_name: "Acme Corp" });
 */

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

export interface TemplateVariables {
  business_name?: string;
  human_number?: string;
  callback_number?: string;
  customer_name?: string;
  service_type?: string;
  urgency?: string;
  availability_window?: string;
  company_name?: string; // Alias for business_name
}

export interface TemplateConfig {
  max_length_chars: number;
  default_business_name: string;
  default_human_number: string;
  default_voice: string;
  enable_validation: boolean;
}

export const TEMPLATE_CONFIG: TemplateConfig = {
  max_length_chars: 500, // ~15 seconds at average speaking rate
  default_business_name: "Apex Business Systems",
  default_human_number: "+14319900222",
  default_voice: "Polly.Joanna",
  enable_validation: true,
};

// ============================================================================
// CORE TEMPLATES
// ============================================================================

export const TEMPLATES = {
  // === GREETING & CONSENT ===
  GREETING: "Hi, you've reached {business_name} — Your 24/7 AI Receptionist! How can I help? Press 0 to speak with someone directly.",
  GREETING_BRIDGE: "Hi, you've reached {business_name} — Your 24/7 AI Receptionist! Connecting you now.",
  CONSENT_PROMPT: "Press 1 to consent to recording. Otherwise, we will continue without recording.",
  CONSENT_ACCEPTED: "Thank you. How can I help you today?",
  CONSENT_DECLINED: "No problem at all — I'll make a note and we won't record this conversation. How can I help you today?",

  // === AI ASSISTANT ROUTING ===
  ADMIN_LINE_ACTIVE: "Admin line active. Connecting you to the AI assistant.",
  CONNECTING_TO_AGENT: "Connecting you to an agent now.",

  // === VOICEMAIL ===
  VOICEMAIL_PROMPT: "Please leave a message after the tone. Press pound when finished.",
  VOICEMAIL_THANK_YOU: "Thank you. Your message has been recorded. Goodbye.",
  VOICEMAIL_ERROR: "We're sorry, but we couldn't record your message. Please call back later.",

  // === MENU / ROUTING ===
  MENU_SALES: "Connecting you to our sales team.",
  MENU_SUPPORT: "Connecting you to technical support.",
  MENU_INVALID: "Invalid selection. Please try again. Press 1 for Sales. Press 2 for Support. Press 9 to leave a voicemail.",
  MENU_TIMEOUT_FALLBACK: "We didn't receive your selection. Transferring you to voicemail.",

  // === ERROR HANDLING ===
  ERROR_TECHNICAL_DIFFICULTIES: "We're sorry, but we're experiencing technical difficulties. Please try again later.",
  ERROR_GENERIC: "We're sorry, but we're experiencing technical difficulties.",

  // === EMERGENCY / URGENCY ===
  EMERGENCY_REDIRECT: "This sounds urgent. Let me connect you to {human_number} immediately. One moment please.",

  // === STANDARD FORWARDING (non-AI mode) ===
  FORWARDING_ACTIVE: "Welcome to {business_name}. Your forwarding is active.",

  // === NO-RECORD MODE ===
  NO_RECORD_CONFIRMATION: "Understood. This call will not be recorded. How can I assist you?",

  // === FRONT DOOR / CONSENT ===
  FRONTDOOR_GREETING: "Thank you for calling {business_name}. This call may be recorded for quality and training purposes. By staying on the line, you consent to being recorded.",
  FRONTDOOR_MENU: "Press 1 for Sales. Press 2 for Support. Press 9 to leave a voicemail. Press star to repeat this menu.",
  FRONTDOOR_RATE_LIMIT: "We're experiencing high call volume. Please try again later.",
} as const;

// ============================================================================
// TwiML TEMPLATES
// ============================================================================

export const TWIML_TEMPLATES = {
  CONSENT_GATHER: (consentUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${consentUrl}" method="POST" input="dtmf" numDigits="1" timeout="4">
    <Say voice="${voice}">${TEMPLATES.CONSENT_PROMPT}</Say>
  </Gather>
  <Redirect method="POST">${consentUrl}</Redirect>
</Response>`,

  GREETING_WITH_STREAM: (
    supabaseUrl: string,
    callSid: string,
    recordingEnabled: boolean,
    businessName: string,
    dialTarget: string,
    toNumber: string,
    voice: string = TEMPLATE_CONFIG.default_voice
  ) => {
    const recordAttr = recordingEnabled ? "record-from-answer" : "do-not-record";
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/voice-recording-callback`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/voice-status-callback`;
    const greeting = renderTemplate(TEMPLATES.GREETING, { business_name: businessName });

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-action?recording_enabled=${recordingEnabled}" numDigits="1" timeout="1">
    <Say voice="${voice}">${greeting}</Say>
  </Gather>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true">
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${callSid}" />
  </Connect>
  <Say voice="${voice}">${TEMPLATES.CONNECTING_TO_AGENT}</Say>
  <Dial callerId="${toNumber}" record="${recordAttr}" recordingStatusCallback="${recordingCallbackUrl}" statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">
    <Number>${dialTarget}</Number>
  </Dial>
</Response>`;
  },

  BRIDGE_TO_HUMAN: (
    businessName: string,
    dialTarget: string,
    toNumber: string,
    recordingEnabled: boolean,
    supabaseUrl: string,
    voice: string = TEMPLATE_CONFIG.default_voice
  ) => {
    const recordAttr = recordingEnabled ? "record-from-answer" : "do-not-record";
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/voice-recording-callback`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/voice-status-callback`;
    const greeting = renderTemplate(TEMPLATES.GREETING_BRIDGE, { business_name: businessName });

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${greeting}</Say>
  <Dial callerId="${toNumber}" record="${recordAttr}" recordingStatusCallback="${recordingCallbackUrl}" statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">
    <Number>${dialTarget}</Number>
  </Dial>
</Response>`;
  },

  ERROR_RESPONSE: (voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.ERROR_TECHNICAL_DIFFICULTIES}</Say>
  <Hangup/>
</Response>`,

  ADMIN_STREAM: (supabaseUrl: string, callSid: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.ADMIN_LINE_ACTIVE}</Say>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true">
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${callSid}" />
  </Connect>
  <Say voice="${voice}">Goodbye.</Say>
</Response>`,

  VOICEMAIL_RECORD: (supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.VOICEMAIL_PROMPT}</Say>
  <Record action="${supabaseUrl}/functions/v1/voice-voicemail"
          maxLength="180"
          finishOnKey="#"
          transcribe="true"
          transcribeCallback="${supabaseUrl}/functions/v1/voice-voicemail"/>
  <Say voice="${voice}">${TEMPLATES.VOICEMAIL_THANK_YOU}</Say>
  <Hangup/>
</Response>`,

  VOICEMAIL_ERROR_RESPONSE: (voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.VOICEMAIL_ERROR}</Say>
  <Hangup/>
</Response>`,

  MENU_ROUTE_SALES: (salesNumber: string, supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.MENU_SALES}</Say>
  <Dial timeout="20" action="${supabaseUrl}/functions/v1/voice-status" record="record-from-answer-dual">
    <Number statusCallback="${supabaseUrl}/functions/v1/voice-status">${salesNumber}</Number>
  </Dial>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=no_answer</Redirect>
</Response>`,

  MENU_ROUTE_SUPPORT: (supportNumber: string, supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.MENU_SUPPORT}</Say>
  <Dial timeout="20" action="${supabaseUrl}/functions/v1/voice-status" record="record-from-answer-dual">
    <Number statusCallback="${supabaseUrl}/functions/v1/voice-status">${supportNumber}</Number>
  </Dial>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=no_answer</Redirect>
</Response>`,

  MENU_INVALID_RETRY: (supabaseUrl: string, retryCount: number, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${supabaseUrl}/functions/v1/voice-menu-handler?retry=${retryCount}" method="POST" numDigits="1" timeout="5">
    <Say voice="${voice}">${TEMPLATES.MENU_INVALID}</Say>
  </Gather>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=menu_timeout</Redirect>
</Response>`,

  MENU_TIMEOUT_VOICEMAIL: (voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.MENU_TIMEOUT_FALLBACK}</Say>
  <Redirect method="POST">${new URL(Deno.env.get('SUPABASE_URL') || '').origin}/functions/v1/voice-voicemail?reason=menu_timeout</Redirect>
</Response>`,

  MENU_ERROR_RESPONSE: (supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.ERROR_GENERIC}</Say>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=error</Redirect>
</Response>`,

  FORWARDING_ACTIVE_TWIML: (businessName: string, voice: string = TEMPLATE_CONFIG.default_voice) => {
    const message = renderTemplate(TEMPLATES.FORWARDING_ACTIVE, { business_name: businessName });
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${message}</Say>
</Response>`;
  },

  FRONTDOOR_CONSENT_MENU: (businessName: string, supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => {
    const greeting = renderTemplate(TEMPLATES.FRONTDOOR_GREETING, { business_name: businessName });
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="en-CA">${greeting}</Say>
  <Gather action="${supabaseUrl}/functions/v1/voice-menu-handler" method="POST" numDigits="1" timeout="5">
    <Say voice="${voice}">${TEMPLATES.FRONTDOOR_MENU}</Say>
  </Gather>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=menu_timeout</Redirect>
</Response>`;
  },

  FRONTDOOR_MENU_ONLY: (supabaseUrl: string, voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${supabaseUrl}/functions/v1/voice-menu-handler" method="POST" numDigits="1" timeout="5">
    <Say voice="${voice}">${TEMPLATES.FRONTDOOR_MENU}</Say>
  </Gather>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=menu_timeout</Redirect>
</Response>`,

  FRONTDOOR_RATE_LIMIT_RESPONSE: (voice: string = TEMPLATE_CONFIG.default_voice) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${TEMPLATES.FRONTDOOR_RATE_LIMIT}</Say>
  <Hangup/>
</Response>`,
} as const;

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

/**
 * Safely substitute placeholders in a template string
 *
 * @param template - Template string with {placeholder} syntax
 * @param variables - Key-value pairs for substitution
 * @returns Rendered string with safe fallback values
 *
 * @example
 *   renderTemplate("Hello {customer_name}", { customer_name: "Alice" })
 *   // => "Hello Alice"
 *
 *   renderTemplate("Hello {customer_name}", {})
 *   // => "Hello [customer name]"  (safe fallback)
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables = {}
): string {
  // Normalize: company_name is an alias for business_name
  if (variables.company_name && !variables.business_name) {
    variables.business_name = variables.company_name;
  }

  let result = template;
  const placeholderRegex = /\{([a-z_]+)\}/g;
  const foundPlaceholders = new Set<string>();

  // First pass: collect all placeholders
  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    foundPlaceholders.add(match[1]);
  }

  // Second pass: substitute with fallbacks
  for (const key of foundPlaceholders) {
    const value = variables[key as keyof TemplateVariables];
    const fallback = getFallbackValue(key);

    // Safety: never allow undefined, null, or NaN
    const safeValue = (value && value !== 'undefined' && value !== 'null')
      ? sanitizeValue(value)
      : fallback;

    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), safeValue);
  }

  // Validation: detect any remaining placeholders
  if (TEMPLATE_CONFIG.enable_validation) {
    const remainingPlaceholders = result.match(/\{[a-z_]+\}/g);
    if (remainingPlaceholders) {
      console.warn(`[Template Warning] Unsubstituted placeholders: ${remainingPlaceholders.join(', ')}`);
    }
  }

  // Length check
  if (result.length > TEMPLATE_CONFIG.max_length_chars) {
    console.warn(`[Template Warning] Response exceeds max length: ${result.length} chars (limit: ${TEMPLATE_CONFIG.max_length_chars})`);
  }

  return result;
}

/**
 * Get safe fallback value for a placeholder
 */
function getFallbackValue(key: string): string {
  const fallbacks: Record<string, string> = {
    business_name: TEMPLATE_CONFIG.default_business_name,
    company_name: TEMPLATE_CONFIG.default_business_name,
    human_number: TEMPLATE_CONFIG.default_human_number,
    callback_number: 'the number you provided',
    customer_name: 'there',
    service_type: 'your request',
    urgency: 'standard priority',
    availability_window: 'at your earliest convenience',
  };

  return fallbacks[key] || `[${key.replace(/_/g, ' ')}]`;
}

/**
 * Sanitize user input to prevent injection or formatting issues
 */
function sanitizeValue(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove XML/HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 100); // Max 100 chars per field
}

/**
 * Validate template string for common issues
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for banned strings
  const bannedStrings = ['undefined', 'null', 'NaN', '[object Object]'];
  for (const banned of bannedStrings) {
    if (template.includes(banned)) {
      errors.push(`Template contains banned string: "${banned}"`);
    }
  }

  // Check for mismatched placeholders
  const placeholders = template.match(/\{([a-z_]+)\}/g) || [];
  const invalidPlaceholders = placeholders.filter(p => {
    const key = p.slice(1, -1);
    return !['business_name', 'company_name', 'human_number', 'callback_number',
             'customer_name', 'service_type', 'urgency', 'availability_window'].includes(key);
  });

  if (invalidPlaceholders.length > 0) {
    warnings.push(`Unknown placeholders: ${invalidPlaceholders.join(', ')}`);
  }

  // Check length
  if (template.length > TEMPLATE_CONFIG.max_length_chars) {
    warnings.push(`Template exceeds recommended max length: ${template.length} chars`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TEMPLATES,
  TWIML_TEMPLATES,
  renderTemplate,
  validateTemplate,
  TEMPLATE_CONFIG,
};
