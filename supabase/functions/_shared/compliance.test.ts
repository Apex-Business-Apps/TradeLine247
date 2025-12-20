/**
 * Unit Tests for TL247 Compliance Middleware
 *
 * Tests all pure functions in the compliance module:
 * - requireRecordingConsent
 * - requireSmsOptIn
 * - enforceQuietHours
 * - applySuppression
 * - redactSensitive
 * - categorizeCall
 * - determineRecordingMode
 *
 * Run with: deno test --allow-env supabase/functions/_shared/compliance.test.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  requireRecordingConsent,
  requireSmsOptIn,
  enforceQuietHours,
  applySuppression,
  redactSensitive,
  categorizeCall,
  determineRecordingMode,
  buildNoRecordMetadata,
  createTL247Meta,
  serializeTL247Meta,
  parseTL247Meta,
  isWithinQuietHours,
  isValidE164,
  type SessionContext,
} from "./compliance.ts";

// ============================================================================
// TEST: requireRecordingConsent
// ============================================================================

Deno.test("requireRecordingConsent - blocks when consent not granted", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "pending",
    smsOptIn: "unknown",
    recordingMode: "unknown",
  };

  const result = requireRecordingConsent({ type: "record" }, session);

  assertEquals(result.allow, false);
  assertEquals(result.action, "block");
  assertExists(result.reason);
});

Deno.test("requireRecordingConsent - allows when consent granted", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "granted",
    smsOptIn: "unknown",
    recordingMode: "full",
  };

  const result = requireRecordingConsent({ type: "record" }, session);

  assertEquals(result.allow, true);
  assertEquals(result.action, "allow");
});

Deno.test("requireRecordingConsent - blocks when consent denied", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "denied",
    smsOptIn: "unknown",
    recordingMode: "no_record",
  };

  const result = requireRecordingConsent({ type: "record" }, session);

  assertEquals(result.allow, false);
  assertEquals(result.action, "block");
});

// ============================================================================
// TEST: requireSmsOptIn
// ============================================================================

Deno.test("requireSmsOptIn - allows transactional SMS without opt-in", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "unknown",
    smsOptIn: "unknown",
    recordingMode: "unknown",
  };

  const result = requireSmsOptIn({ type: "sms", purpose: "transactional" }, session);

  assertEquals(result.allow, true);
  assertEquals(result.action, "allow");
});

Deno.test("requireSmsOptIn - blocks marketing SMS without opt-in", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "unknown",
    smsOptIn: "unknown",
    recordingMode: "unknown",
  };

  const result = requireSmsOptIn({ type: "sms", purpose: "marketing" }, session);

  assertEquals(result.allow, false);
  assertEquals(result.action, "block");
});

Deno.test("requireSmsOptIn - allows marketing SMS with opt-in", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "unknown",
    smsOptIn: "opted_in",
    recordingMode: "unknown",
  };

  const result = requireSmsOptIn({ type: "sms", purpose: "marketing" }, session);

  assertEquals(result.allow, true);
  assertEquals(result.action, "allow");
});

// ============================================================================
// TEST: enforceQuietHours
// ============================================================================

Deno.test("enforceQuietHours - allows within window", () => {
  const proposed = new Date("2024-01-15T14:00:00Z"); // 2pm UTC
  const result = enforceQuietHours(proposed, "America/New_York"); // 9am ET

  assertEquals(result.needs_review, false);
});

Deno.test("enforceQuietHours - adjusts when before window", () => {
  const proposed = new Date("2024-01-15T10:00:00Z"); // 10am UTC = 5am ET
  const result = enforceQuietHours(proposed, "America/New_York");

  // Should be adjusted (before 8am local)
  assertExists(result.adjusted_time);
  assertExists(result.original_time);
});

Deno.test("enforceQuietHours - requires review when timezone unknown", () => {
  const proposed = new Date("2024-01-15T14:00:00Z");
  const result = enforceQuietHours(proposed, undefined);

  assertEquals(result.needs_review, true);
  assertExists(result.reason);
});

Deno.test("enforceQuietHours - requires review when timezone is 'unknown'", () => {
  const proposed = new Date("2024-01-15T14:00:00Z");
  const result = enforceQuietHours(proposed, "unknown");

  assertEquals(result.needs_review, true);
});

// ============================================================================
// TEST: applySuppression
// ============================================================================

Deno.test("applySuppression - returns suppressed when on DNC list", async () => {
  const result = await applySuppression(
    { type: "voice", identifier: "+14165551234" },
    { suppressed: true, type: "voice" }
  );

  assertEquals(result.suppressed, true);
  assertExists(result.reason);
});

Deno.test("applySuppression - returns not suppressed when not on list", async () => {
  const result = await applySuppression(
    { type: "voice", identifier: "+14165551234" },
    undefined
  );

  assertEquals(result.suppressed, false);
});

// ============================================================================
// TEST: redactSensitive
// ============================================================================

Deno.test("redactSensitive - redacts phone numbers", () => {
  const text = "Call me at +14165551234 or 416-555-1234";
  const result = redactSensitive(text);

  assertEquals(result.includes("+14165551234"), false);
  assertEquals(result.includes("416-555-1234"), false);
  assertEquals(result.includes("[PHONE]"), true);
});

Deno.test("redactSensitive - redacts email addresses", () => {
  const text = "Email me at john.doe@example.com";
  const result = redactSensitive(text);

  assertEquals(result.includes("john.doe@example.com"), false);
  assertEquals(result.includes("[EMAIL]"), true);
});

Deno.test("redactSensitive - redacts credit card numbers", () => {
  const text = "Card: 4111-1111-1111-1111";
  const result = redactSensitive(text);

  assertEquals(result.includes("4111"), false);
  assertEquals(result.includes("[CARD]"), true);
});

Deno.test("redactSensitive - handles empty string", () => {
  const result = redactSensitive("");
  assertEquals(result, "");
});

// ============================================================================
// TEST: categorizeCall
// ============================================================================

Deno.test("categorizeCall - returns customer_service for existing customer", () => {
  const result = categorizeCall({ isExistingCustomer: true });
  assertEquals(result, "customer_service");
});

Deno.test("categorizeCall - returns lead_capture for booking signals", () => {
  const result = categorizeCall({ transcript: "I need a quote for plumbing work" });
  assertEquals(result, "lead_capture");
});

Deno.test("categorizeCall - returns prospect_call for interest signals", () => {
  const result = categorizeCall({ transcript: "I'm interested in learning more about your services" });
  assertEquals(result, "prospect_call");
});

Deno.test("categorizeCall - returns customer_service as default", () => {
  const result = categorizeCall({});
  assertEquals(result, "customer_service");
});

// ============================================================================
// TEST: determineRecordingMode
// ============================================================================

Deno.test("determineRecordingMode - returns full when consent granted", () => {
  const result = determineRecordingMode("granted", true);
  assertEquals(result, "full");
});

Deno.test("determineRecordingMode - returns no_record when consent pending", () => {
  const result = determineRecordingMode("pending", true);
  assertEquals(result, "no_record");
});

Deno.test("determineRecordingMode - returns no_record when jurisdiction unknown", () => {
  const result = determineRecordingMode("granted", false);
  assertEquals(result, "no_record");
});

Deno.test("determineRecordingMode - returns no_record when consent denied", () => {
  const result = determineRecordingMode("denied", true);
  assertEquals(result, "no_record");
});

// ============================================================================
// TEST: buildNoRecordMetadata
// ============================================================================

Deno.test("buildNoRecordMetadata - builds correct structure", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "denied",
    smsOptIn: "unknown",
    recordingMode: "no_record",
  };

  const result = buildNoRecordMetadata(session, {
    callerIdName: "John Doe",
    callerIdNumber: "+14165551234",
    callCategory: "customer_service",
    redactedSummary: "Customer inquiry about service",
  });

  assertEquals(result.recording_mode, "no_record");
  assertEquals(result.call_category, "customer_service");
  assertEquals(result.consent_state, "denied");
  assertExists(result.caller_id_name);
  assertExists(result.caller_id_number);
});

// ============================================================================
// TEST: TL247_META serialization
// ============================================================================

Deno.test("serializeTL247Meta - produces correct format", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "granted",
    smsOptIn: "opted_in",
    recordingMode: "full",
  };

  const meta = createTL247Meta(session, {
    call_category: "lead_capture",
    sentiment: 0.5,
    needs_review: false,
  });

  const serialized = serializeTL247Meta(meta);

  assertEquals(serialized.startsWith("<TL247_META>"), true);
  assertEquals(serialized.endsWith("</TL247_META>"), true);
});

Deno.test("parseTL247Meta - parses valid meta block", () => {
  const text = 'Some response text <TL247_META>{"call_category":"lead_capture","consent_state":"granted","recording_mode":"full","sentiment":0.5,"vision_anchor_flag":false,"needs_review":false}</TL247_META>';

  const result = parseTL247Meta(text);

  assertExists(result);
  assertEquals(result?.call_category, "lead_capture");
  assertEquals(result?.consent_state, "granted");
});

Deno.test("parseTL247Meta - returns null for missing block", () => {
  const text = "Some response without meta block";
  const result = parseTL247Meta(text);
  assertEquals(result, null);
});

// ============================================================================
// TEST: Helper functions
// ============================================================================

Deno.test("isWithinQuietHours - correct for various hours", () => {
  assertEquals(isWithinQuietHours(7), false); // Before 8am
  assertEquals(isWithinQuietHours(8), true);  // At 8am
  assertEquals(isWithinQuietHours(14), true); // 2pm
  assertEquals(isWithinQuietHours(20), true); // 8pm
  assertEquals(isWithinQuietHours(21), false); // At 9pm
  assertEquals(isWithinQuietHours(22), false); // After 9pm
});

Deno.test("isValidE164 - validates correct formats", () => {
  assertEquals(isValidE164("+14165551234"), true);
  assertEquals(isValidE164("+1234567890123"), true);
  assertEquals(isValidE164("4165551234"), false);
  assertEquals(isValidE164("+0123456789"), false); // Starts with 0
  assertEquals(isValidE164(""), false);
});

// ============================================================================
// TEST: Fail-closed behavior
// ============================================================================

Deno.test("FAIL-CLOSED: Recording blocked when consent unknown", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "unknown",
    smsOptIn: "unknown",
    recordingMode: "unknown",
  };

  const result = requireRecordingConsent({ type: "record" }, session);
  assertEquals(result.allow, false, "FAIL-CLOSED: Must block recording when consent is unknown");
});

Deno.test("FAIL-CLOSED: Marketing SMS blocked when opt-in pending", () => {
  const session: SessionContext = {
    callSid: "CA123",
    consentState: "granted",
    smsOptIn: "pending",
    recordingMode: "full",
  };

  const result = requireSmsOptIn({ type: "sms", purpose: "marketing" }, session);
  assertEquals(result.allow, false, "FAIL-CLOSED: Must block marketing SMS when opt-in is pending");
});

Deno.test("FAIL-CLOSED: No-record mode when jurisdiction unknown", () => {
  const mode = determineRecordingMode("granted", false);
  assertEquals(mode, "no_record", "FAIL-CLOSED: Must use no-record mode when jurisdiction is unknown");
});

console.log("✅ All compliance middleware tests defined");
