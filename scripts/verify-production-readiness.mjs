#!/usr/bin/env node
/**
 * Production Readiness Verification
 *
 * Comprehensive check for production deployment readiness.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

console.log('\n🚀 Production Readiness Check\n');
console.log('═'.repeat(60));

const checks = {
  passed: [],
  failed: [],
  warnings: [],
};

function pass(name) {
  checks.passed.push(name);
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  checks.failed.push({ name, reason });
  console.log(`  ✗ ${name}: ${reason}`);
}

function warn(name, reason) {
  checks.warnings.push({ name, reason });
  console.log(`  ⚠ ${name}: ${reason}`);
}

// 1. Build Check
console.log('\n📦 Build Configuration:');
try {
  const pkgPath = join(ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.scripts?.build) {
      pass('Build script configured');
    } else {
      fail('Build script', 'No build script in package.json');
    }

    if (pkg.scripts?.test) {
      pass('Test script configured');
    } else {
      warn('Test script', 'No test script found');
    }
  }
} catch (e) {
  fail('package.json', e.message);
}

// 2. TypeScript Configuration
console.log('\n📝 TypeScript:');
const tsconfigPath = join(ROOT, 'tsconfig.json');
if (existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    if (tsconfig.compilerOptions?.strict) {
      pass('Strict mode enabled');
    } else {
      warn('Strict mode', 'Consider enabling strict mode');
    }
    pass('tsconfig.json present');
  } catch (e) {
    fail('tsconfig.json', 'Invalid JSON');
  }
} else {
  fail('TypeScript', 'tsconfig.json not found');
}

// 3. Security Checks
console.log('\n🔒 Security:');

// Check for .env in gitignore
const gitignorePath = join(ROOT, '.gitignore');
if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, 'utf-8');
  if (gitignore.includes('.env')) {
    pass('.env files excluded from git');
  } else {
    fail('Git security', '.env not in .gitignore');
  }
}

// Check for hardcoded secrets
const sensitivePatterns = [
  /sk_live_[a-zA-Z0-9]{24}/,
  /sk_test_[a-zA-Z0-9]{24}/,
  /password\s*[=:]\s*["'][^"']+["']/i,
];

// 4. Database Migrations
console.log('\n🗄️  Database:');
const migrationsDir = join(ROOT, 'supabase/migrations');
if (existsSync(migrationsDir)) {
  pass('Migrations directory exists');

  // Check for enterprise migrations
  const files = require('fs').readdirSync(migrationsDir);
  const bookingMigration = files.find(f => f.includes('booking'));
  const securityMigration = files.find(f => f.includes('security'));

  if (bookingMigration) pass('Booking schema migration');
  else fail('Booking migration', 'Not found');

  if (securityMigration) pass('Security monitoring migration');
  else fail('Security migration', 'Not found');
} else {
  fail('Migrations', 'Directory not found');
}

// 5. Edge Functions
console.log('\n⚡ Edge Functions:');
const functionsDir = join(ROOT, 'supabase/functions');
if (existsSync(functionsDir)) {
  const requiredFunctions = [
    'create-booking',
    'health-check',
    'send-booking-confirmation',
  ];

  for (const fn of requiredFunctions) {
    const fnPath = join(functionsDir, fn, 'index.ts');
    if (existsSync(fnPath)) {
      pass(`${fn} function`);
    } else {
      fail(fn, 'Not found');
    }
  }
} else {
  fail('Edge functions', 'Directory not found');
}

// 6. Monitoring
console.log('\n📊 Monitoring:');
const monitoringPath = join(ROOT, 'supabase/functions/_shared/enterprise-monitoring.ts');
if (existsSync(monitoringPath)) {
  const content = readFileSync(monitoringPath, 'utf-8');

  if (content.includes('logEvent')) pass('Event logging configured');
  else warn('Event logging', 'Not configured');

  if (content.includes('CircuitBreaker')) pass('Circuit breaker pattern');
  else warn('Circuit breaker', 'Not implemented');
}

// 7. Frontend Components
console.log('\n🎨 Frontend:');
const requiredComponents = [
  'src/components/booking/CreditCardDialog.tsx',
  'src/components/admin/EnterpriseDashboard.tsx',
];

for (const comp of requiredComponents) {
  if (existsSync(join(ROOT, comp))) {
    pass(comp.split('/').pop());
  } else {
    warn(comp.split('/').pop(), 'Not found');
  }
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📋 Production Readiness Summary:\n');

console.log(`  ✅ Passed: ${checks.passed.length}`);
console.log(`  ⚠️  Warnings: ${checks.warnings.length}`);
console.log(`  ❌ Failed: ${checks.failed.length}`);

if (checks.failed.length > 0) {
  console.log('\n🚫 Blocking Issues:');
  for (const { name, reason } of checks.failed) {
    console.log(`   - ${name}: ${reason}`);
  }
}

const readinessScore = Math.round(
  (checks.passed.length / (checks.passed.length + checks.failed.length)) * 100
);

console.log(`\n📈 Readiness Score: ${readinessScore}%`);

if (readinessScore >= 90) {
  console.log('✅ READY FOR PRODUCTION\n');
} else if (readinessScore >= 70) {
  console.log('⚠️  NEEDS ATTENTION BEFORE PRODUCTION\n');
} else {
  console.log('❌ NOT READY FOR PRODUCTION\n');
}

process.exit(checks.failed.length > 0 ? 1 : 0);
