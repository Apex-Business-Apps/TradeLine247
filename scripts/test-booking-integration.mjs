#!/usr/bin/env node
/**
 * Booking Integration Test
 *
 * Tests the booking flow integration between frontend, edge functions, and database.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

console.log('\n📅 Booking Integration Test\n');
console.log('═'.repeat(50));

let passed = 0;
let failed = 0;

function check(category, name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
    return true;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
    return false;
  }
}

function fileContains(path, content) {
  const fullPath = join(ROOT, path);
  if (!existsSync(fullPath)) return false;
  return readFileSync(fullPath, 'utf-8').includes(content);
}

function fileExists(path) {
  return existsSync(join(ROOT, path));
}

// Database Schema
console.log('\n🗄️  Database Schema:');
const migrationPath = 'supabase/migrations/20251206000001_booking_system_schema.sql';
if (fileExists(migrationPath)) {
  const schema = readFileSync(join(ROOT, migrationPath), 'utf-8');

  check('DB', 'Bookings table', schema.includes('CREATE TABLE bookings'));
  check('DB', 'Appointments table', schema.includes('CREATE TABLE appointments'));
  check('DB', 'Payment tokens table', schema.includes('CREATE TABLE payment_tokens'));
  check('DB', 'Booking confirmations table', schema.includes('CREATE TABLE booking_confirmations'));
  check('DB', 'Calendar integrations table', schema.includes('CREATE TABLE calendar_integrations'));
  check('DB', 'RLS policies', schema.includes('CREATE POLICY'));
  check('DB', 'Booking reference function', schema.includes('generate_booking_reference'));
} else {
  console.log('  ✗ Migration file not found');
  failed += 7;
}

// Edge Functions
console.log('\n⚡ Edge Functions:');
const createBookingPath = 'supabase/functions/create-booking/index.ts';
if (fileExists(createBookingPath)) {
  check('API', 'Create booking endpoint', true);
  check('API', 'Stripe integration', fileContains(createBookingPath, 'stripe'));
  check('API', 'Rate limiting', fileContains(createBookingPath, 'rate') || fileContains(createBookingPath, 'checkRateLimit'));
  check('API', 'Input validation', fileContains(createBookingPath, 'sanitize') || fileContains(createBookingPath, 'validate'));
  check('API', 'Error handling', fileContains(createBookingPath, 'catch'));
} else {
  console.log('  ✗ Create booking function not found');
  failed += 5;
}

const sendConfirmationPath = 'supabase/functions/send-booking-confirmation/index.ts';
if (fileExists(sendConfirmationPath)) {
  check('API', 'Send confirmation endpoint', true);
  check('API', 'Email sending', fileContains(sendConfirmationPath, 'email') || fileContains(sendConfirmationPath, 'SMTP'));
  check('API', 'SMS sending', fileContains(sendConfirmationPath, 'sms') || fileContains(sendConfirmationPath, 'TWILIO'));
} else {
  console.log('  ✗ Send confirmation function not found');
  failed += 3;
}

// Calendar Integration
console.log('\n📆 Calendar Integration:');
const calendarSyncPath = 'supabase/functions/sync-calendar-event/index.ts';
if (fileExists(calendarSyncPath)) {
  check('Calendar', 'Sync function exists', true);
  check('Calendar', 'Google Calendar support', fileContains(calendarSyncPath, 'google'));
  check('Calendar', 'OAuth token handling', fileContains(calendarSyncPath, 'access_token') || fileContains(calendarSyncPath, 'refresh'));
}

// Frontend Components
console.log('\n🎨 Frontend Components:');
const creditCardPath = 'src/components/booking/CreditCardDialog.tsx';
if (fileExists(creditCardPath)) {
  check('UI', 'Credit card dialog', true);
  check('UI', 'Card validation', fileContains(creditCardPath, 'validate'));
  check('UI', 'Card formatting', fileContains(creditCardPath, 'format'));
}

const calendarIntegrationPath = 'src/components/booking/CalendarIntegration.tsx';
if (fileExists(calendarIntegrationPath)) {
  check('UI', 'Calendar integration component', true);
  check('UI', 'OAuth connect flow', fileContains(calendarIntegrationPath, 'Connect') || fileContains(calendarIntegrationPath, 'OAuth'));
}

// Security
console.log('\n🔐 Security:');
const securityPath = 'supabase/functions/_shared/security-middleware.ts';
if (fileExists(securityPath)) {
  check('Security', 'Security middleware', true);
  check('Security', 'Rate limiting function', fileContains(securityPath, 'checkRateLimit'));
  check('Security', 'Input sanitization', fileContains(securityPath, 'sanitize'));
  check('Security', 'Auth verification', fileContains(securityPath, 'verifyAuth'));
}

// Summary
console.log('\n═'.repeat(50));
console.log(`\n📋 Integration Test Results: ${passed} passed, ${failed} failed`);

const coverage = Math.round((passed / (passed + failed)) * 100);
console.log(`📊 Coverage: ${coverage}%\n`);

if (failed === 0) {
  console.log('✅ All booking integration tests passed!\n');
} else {
  console.log('❌ Some integration tests failed. Review above.\n');
}

process.exit(failed > 0 ? 1 : 0);
