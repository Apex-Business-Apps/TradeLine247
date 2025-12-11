#!/usr/bin/env node
/**
 * Enterprise Validation Script
 *
 * Validates enterprise feature configuration and dependencies.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

console.log('\n🏢 Enterprise Validation\n');
console.log('═'.repeat(50));

const issues = [];
const warnings = [];

// Check package.json for required dependencies
console.log('\n📦 Checking Dependencies...');
const pkgPath = join(ROOT, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const requiredDeps = ['@supabase/supabase-js', 'stripe', 'react', 'typescript'];
  for (const dep of requiredDeps) {
    if (deps[dep]) {
      console.log(`  ✓ ${dep}: ${deps[dep]}`);
    } else {
      warnings.push(`Missing optional dependency: ${dep}`);
      console.log(`  ⚠ ${dep}: not found`);
    }
  }
}

// Check Supabase functions structure
console.log('\n🔧 Checking Edge Functions Structure...');
const functionsDir = join(ROOT, 'supabase/functions');
if (existsSync(functionsDir)) {
  const functions = readdirSync(functionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);

  console.log(`  Found ${functions.length} edge functions`);

  for (const fn of functions) {
    const indexPath = join(functionsDir, fn, 'index.ts');
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8');

      // Check for proper error handling
      if (!content.includes('try') || !content.includes('catch')) {
        warnings.push(`${fn}: Missing try-catch error handling`);
      }

      // Check for CORS headers
      if (content.includes('serve') && !content.includes('cors')) {
        warnings.push(`${fn}: May need CORS headers`);
      }

      console.log(`  ✓ ${fn}/index.ts`);
    } else {
      issues.push(`${fn}: Missing index.ts`);
      console.log(`  ✗ ${fn}/index.ts`);
    }
  }
}

// Check shared modules
console.log('\n📚 Checking Shared Modules...');
const sharedDir = join(ROOT, 'supabase/functions/_shared');
if (existsSync(sharedDir)) {
  const sharedFiles = readdirSync(sharedDir);
  for (const file of sharedFiles) {
    console.log(`  ✓ _shared/${file}`);
  }
} else {
  issues.push('Missing _shared directory');
  console.log('  ✗ _shared directory not found');
}

// Check migrations
console.log('\n🗄️  Checking Migrations...');
const migrationsDir = join(ROOT, 'supabase/migrations');
if (existsSync(migrationsDir)) {
  const migrations = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`  Found ${migrations.length} migrations`);

  const enterpriseMigrations = migrations.filter(m =>
    m.includes('booking') || m.includes('security') || m.includes('enterprise')
  );

  for (const m of enterpriseMigrations) {
    console.log(`  ✓ ${m}`);
  }
}

// Check environment requirements
console.log('\n🔐 Environment Requirements:');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'OPENAI_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];
console.log('  Required environment variables:');
for (const envVar of requiredEnvVars) {
  console.log(`    - ${envVar}`);
}

// Summary
console.log('\n═'.repeat(50));
console.log('\n📋 Validation Summary:\n');

if (issues.length > 0) {
  console.log('❌ Issues:');
  for (const issue of issues) {
    console.log(`   - ${issue}`);
  }
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  for (const warning of warnings) {
    console.log(`   - ${warning}`);
  }
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed!\n');
} else {
  console.log(`\n${issues.length} issues, ${warnings.length} warnings\n`);
}

process.exit(issues.length > 0 ? 1 : 0);
