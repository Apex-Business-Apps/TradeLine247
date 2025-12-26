/**
 * Tests for Response Templates System
 *
 * Validates:
 * - Placeholder substitution
 * - Fallback values for missing data
 * - Banned string prevention
 * - Length limit enforcement
 * - Template validation
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  renderTemplate,
  validateTemplate,
  TEMPLATES,
  TEMPLATE_CONFIG,
  type TemplateVariables,
} from "../responseTemplates.ts";

Deno.test("renderTemplate - basic substitution", () => {
  const result = renderTemplate(TEMPLATES.GREETING, {
    business_name: "Acme Corp",
  });

  assertEquals(result, "Hi, you've reached Acme Corp — Your 24/7 AI Receptionist! How can I help? Press 0 to speak with someone directly.");
});

Deno.test("renderTemplate - missing variable uses fallback", () => {
  const result = renderTemplate(TEMPLATES.GREETING, {});

  assertStringIncludes(result, TEMPLATE_CONFIG.default_business_name);
});

Deno.test("renderTemplate - prevents 'undefined' in output", () => {
  const template = "Welcome to {business_name}!";
  const result = renderTemplate(template, { business_name: undefined });

  assertEquals(result.includes("undefined"), false);
  assertEquals(result.includes("Apex Business Systems"), true);
});

Deno.test("renderTemplate - prevents 'null' in output", () => {
  const template = "Welcome to {business_name}!";
  const result = renderTemplate(template, { business_name: "null" as any });

  assertEquals(result.includes("null"), false);
  assertEquals(result.includes("Apex Business Systems"), true);
});

Deno.test("renderTemplate - handles company_name alias", () => {
  const result = renderTemplate(TEMPLATES.GREETING, {
    company_name: "XYZ Industries",
  });

  assertStringIncludes(result, "XYZ Industries");
});

Deno.test("renderTemplate - sanitizes HTML/XML", () => {
  const template = "Welcome {customer_name}!";
  const result = renderTemplate(template, {
    customer_name: "<script>alert('xss')</script>",
  });

  assertEquals(result.includes("<script>"), false);
  assertEquals(result.includes("alert('xss')"), true); // Text content preserved
});

Deno.test("renderTemplate - sanitizes quotes", () => {
  const template = "Welcome {customer_name}!";
  const result = renderTemplate(template, {
    customer_name: `John "Hacker" O'Brien`,
  });

  assertEquals(result.includes('"'), false);
  assertEquals(result.includes("'"), false);
  assertStringIncludes(result, "John Hacker OBrien");
});

Deno.test("renderTemplate - truncates long values", () => {
  const template = "Request: {service_type}";
  const longValue = "A".repeat(200);
  const result = renderTemplate(template, { service_type: longValue });

  assertEquals(result.includes("A".repeat(200)), false);
  assertEquals(result.length <= 150, true); // Template text + 100 char limit
});

Deno.test("renderTemplate - multiple placeholders", () => {
  const template = "Call {business_name} at {human_number} for {service_type}";
  const result = renderTemplate(template, {
    business_name: "Test Co",
    human_number: "+15551234567",
    service_type: "emergency service",
  });

  assertStringIncludes(result, "Test Co");
  assertStringIncludes(result, "+15551234567");
  assertStringIncludes(result, "emergency service");
});

Deno.test("validateTemplate - valid template passes", () => {
  const result = validateTemplate(TEMPLATES.GREETING);

  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateTemplate - detects banned strings", () => {
  const result = validateTemplate("Welcome to undefined!");

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertStringIncludes(result.errors[0], "undefined");
});

Deno.test("validateTemplate - detects 'null' string", () => {
  const result = validateTemplate("Value is null");

  assertEquals(result.valid, false);
  assertStringIncludes(result.errors[0], "null");
});

Deno.test("validateTemplate - detects 'NaN' string", () => {
  const result = validateTemplate("Result: NaN");

  assertEquals(result.valid, false);
  assertStringIncludes(result.errors[0], "NaN");
});

Deno.test("validateTemplate - warns about unknown placeholders", () => {
  const result = validateTemplate("Welcome {unknown_field}!");

  assertEquals(result.valid, true); // Warnings don't fail validation
  assertEquals(result.warnings.length, 1);
  assertStringIncludes(result.warnings[0], "unknown_field");
});

Deno.test("validateTemplate - warns about excessive length", () => {
  const longTemplate = "A".repeat(600);
  const result = validateTemplate(longTemplate);

  assertEquals(result.valid, true);
  assertEquals(result.warnings.length >= 1, true);
  assertStringIncludes(result.warnings[0], "max length");
});

Deno.test("TEMPLATES - all templates are valid", () => {
  const failures: string[] = [];

  for (const [key, template] of Object.entries(TEMPLATES)) {
    const validation = validateTemplate(template);
    if (!validation.valid) {
      failures.push(`${key}: ${validation.errors.join(', ')}`);
    }
  }

  assertEquals(failures.length, 0, `Invalid templates found: ${failures.join('; ')}`);
});

Deno.test("TEMPLATES - no templates contain banned strings", () => {
  const bannedStrings = ['undefined', 'null', 'NaN', '[object Object]'];
  const failures: string[] = [];

  for (const [key, template] of Object.entries(TEMPLATES)) {
    for (const banned of bannedStrings) {
      if (template.includes(banned)) {
        failures.push(`${key} contains "${banned}"`);
      }
    }
  }

  assertEquals(failures.length, 0, `Templates with banned strings: ${failures.join('; ')}`);
});

Deno.test("TEMPLATES - all stay under max length", () => {
  const failures: string[] = [];
  const maxLen = TEMPLATE_CONFIG.max_length_chars;

  for (const [key, template] of Object.entries(TEMPLATES)) {
    // Render with max-length test values
    const rendered = renderTemplate(template, {
      business_name: "Very Long Business Name Corporation International",
      human_number: "+15551234567890",
      customer_name: "Alexander Maximilian Pemberton",
      service_type: "comprehensive emergency electrical system repair",
    });

    if (rendered.length > maxLen) {
      failures.push(`${key}: ${rendered.length} chars (limit: ${maxLen})`);
    }
  }

  assertEquals(failures.length, 0, `Templates exceeding max length: ${failures.join('; ')}`);
});

Deno.test("TEMPLATES.GREETING - realistic substitution", () => {
  const result = renderTemplate(TEMPLATES.GREETING, {
    business_name: "Bob's Plumbing",
  });

  assertStringIncludes(result, "Bob's Plumbing");
  assertStringIncludes(result, "24/7 AI Receptionist");
  assertStringIncludes(result, "Press 0");
});

Deno.test("TEMPLATES.ERROR_TECHNICAL_DIFFICULTIES - safe generic error", () => {
  const result = TEMPLATES.ERROR_TECHNICAL_DIFFICULTIES;

  assertStringIncludes(result, "sorry");
  assertStringIncludes(result, "technical difficulties");
  assertEquals(result.includes("undefined"), false);
});

Deno.test("TEMPLATES.VOICEMAIL_PROMPT - clear instructions", () => {
  const result = TEMPLATES.VOICEMAIL_PROMPT;

  assertStringIncludes(result, "leave a message");
  assertStringIncludes(result, "after the tone");
  assertStringIncludes(result, "pound");
});

Deno.test("renderTemplate - fallback for all standard placeholders", () => {
  const template = "{business_name} | {human_number} | {customer_name} | {service_type} | {urgency} | {callback_number}";
  const result = renderTemplate(template, {}); // No variables provided

  // Should not contain undefined, null, or empty braces
  assertEquals(result.includes("undefined"), false);
  assertEquals(result.includes("null"), false);
  assertEquals(result.includes("{}"), false);

  // Should contain safe fallbacks
  assertStringIncludes(result, TEMPLATE_CONFIG.default_business_name);
  assertStringIncludes(result, TEMPLATE_CONFIG.default_human_number);
});

Deno.test("renderTemplate - edge case: empty string variable", () => {
  const template = "Welcome to {business_name}!";
  const result = renderTemplate(template, { business_name: "" });

  // Empty string should trigger fallback
  assertStringIncludes(result, TEMPLATE_CONFIG.default_business_name);
});

Deno.test("renderTemplate - edge case: whitespace-only variable", () => {
  const template = "Welcome to {business_name}!";
  const result = renderTemplate(template, { business_name: "   " });

  // Should trim to empty and use fallback
  assertStringIncludes(result, TEMPLATE_CONFIG.default_business_name);
});

Deno.test("TEMPLATES - consistent tone (professional, warm, concise)", () => {
  // Heuristic: check for warm words and avoid overly formal language
  const warmWords = ['help', 'thank', 'sorry', 'please', 'welcome'];
  const formalWords = ['henceforth', 'aforementioned', 'pursuant'];

  const allText = Object.values(TEMPLATES).join(' ').toLowerCase();

  // Should contain at least one warm word
  const hasWarmth = warmWords.some(word => allText.includes(word));
  assertEquals(hasWarmth, true, "Templates should contain warm, friendly language");

  // Should NOT contain overly formal language
  const hasFormal = formalWords.some(word => allText.includes(word));
  assertEquals(hasFormal, false, "Templates should avoid overly formal language");
});
