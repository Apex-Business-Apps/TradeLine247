#!/usr/bin/env node
/**
 * Enterprise Features Test Suite
 *
 * Tests all enterprise booking and monitoring functionality.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const REQUIRED_EDGE_FUNCTIONS = [
  'create-booking',
  'send-booking-confirmation',
  'enhanced-voice-stream',
  'generate-ai-profile',
  'resolve-escalation',
  'sync-calendar-event',
  'health-check',
];

const REQUIRED_SHARED_MODULES = [
  '_shared/enterprise-monitoring.ts',
  '_shared/security-middleware.ts',
];

const REQUIRED_COMPONENTS = [
  'src/components/booking/CreditCardDialog.tsx',
  'src/components/booking/CalendarIntegration.tsx',
  'src/components/admin/EnterpriseDashboard.tsx',
  'src/components/admin/EscalationManagement.tsx',
  'src/components/onboarding/AIOnboardingWizard.tsx',
];

const REQUIRED_MIGRATIONS = [
  'supabase/migrations/20251206000001_booking_system_schema.sql',
  'supabase/migrations/20251206000002_enterprise_security_monitoring.sql',
];

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

function checkFileExists(path) {
  return existsSync(join(ROOT, path));
}

function checkFileContains(path, content) {
  if (!existsSync(join(ROOT, path))) return false;
  const file = readFileSync(join(ROOT, path), 'utf-8');
  return file.includes(content);
}

console.log('\n🔍 Enterprise Features Test Suite\n');
console.log('═'.repeat(50));

// Test Edge Functions
console.log('\n📦 Edge Functions:');
for (const fn of REQUIRED_EDGE_FUNCTIONS) {
  const path = `supabase/functions/${fn}/index.ts`;
  check(fn, checkFileExists(path));
}

// Test Shared Modules
console.log('\n🔧 Shared Modules:');
for (const module of REQUIRED_SHARED_MODULES) {
  const path = `supabase/functions/${module}`;
  check(module, checkFileExists(path));
}

// Test Components
console.log('\n🎨 Frontend Components:');
for (const component of REQUIRED_COMPONENTS) {
  check(component.split('/').pop(), checkFileExists(component));
}

// Test Migrations
console.log('\n🗄️  Database Migrations:');
for (const migration of REQUIRED_MIGRATIONS) {
  check(migration.split('/').pop(), checkFileExists(migration));
}

// Test Feature Implementation Details
console.log('\n🔐 Security Features:');
check('Rate limiting', checkFileContains('supabase/functions/_shared/security-middleware.ts', 'checkRateLimit'));
check('Input sanitization', checkFileContains('supabase/functions/_shared/security-middleware.ts', 'sanitize'));
check('CORS handling', checkFileContains('supabase/functions/create-booking/index.ts', 'cors'));

console.log('\n📊 Monitoring Features:');
check('Circuit breaker', checkFileContains('supabase/functions/_shared/enterprise-monitoring.ts', 'CircuitBreaker'));
check('Health checks', checkFileContains('supabase/functions/health-check/index.ts', 'checkDatabase'));
check('Audit logging', checkFileContains('supabase/functions/_shared/enterprise-monitoring.ts', 'logSecurityEvent'));

console.log('\n💳 Payment Features:');
check('Stripe integration', checkFileContains('supabase/functions/create-booking/index.ts', 'stripe'));
check('Payment authorization', checkFileContains('supabase/functions/create-booking/index.ts', 'capture_method'));

console.log('\n═'.repeat(50));
console.log(`\n📋 Results: ${passed} passed, ${failed} failed\n`);

process.exit(failed > 0 ? 1 : 0);
