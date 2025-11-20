#!/usr/bin/env node

/**
 * Verification Script: Console Usage Checker
 *
 * PURPOSE:
 *   Ensures critical initialization files use console.info() instead of console.log()
 *   for messages that must survive production minification.
 *
 * WHY THIS MATTERS:
 *   - Vite's terser config strips console.log() in production builds
 *   - console.info() is preserved and critical for debugging bundle loading
 *   - This prevents the "blank screen, no logs" production bug
 *
 * USAGE:
 *   npm run verify:console
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const CRITICAL_FILES = [
  'src/main.tsx'
];

const REQUIRED_CONSOLE_INFO_PATTERNS = [
  /console\.info\(['"]🚀 TradeLine 24\/7 - Starting main\.tsx/,
  /console\.info\(['"]✅ Core modules loaded/,
  /console\.info\(['"]✅ React mounted successfully/
];

let hasErrors = false;

console.log('🔍 Verifying console usage in critical files...\n');

for (const file of CRITICAL_FILES) {
  const filePath = resolve(process.cwd(), file);
  let content;

  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ ERROR: Cannot read ${file}`);
    console.error(`   ${error.message}\n`);
    hasErrors = true;
    continue;
  }

  console.log(`📄 Checking ${file}...`);

  // Check for prohibited console.log in critical sections
  const consoleLogMatches = content.match(/console\.log\(/g);
  if (consoleLogMatches) {
    console.warn(`⚠️  WARNING: Found ${consoleLogMatches.length} console.log() calls in ${file}`);
    console.warn(`   These will be stripped in production! Use console.info() instead.\n`);
    hasErrors = true;
  }

  // Verify required console.info patterns exist
  for (const pattern of REQUIRED_CONSOLE_INFO_PATTERNS) {
    if (!pattern.test(content)) {
      console.error(`❌ ERROR: Missing required console.info() in ${file}`);
      console.error(`   Expected pattern: ${pattern}\n`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log(`✅ ${file} passed validation\n`);
  }
}

if (hasErrors) {
  console.error('❌ Console usage verification FAILED');
  console.error('\n📖 REMEDIATION:');
  console.error('   1. Replace console.log() with console.info() for critical logs');
  console.error('   2. Use console.warn() for warnings');
  console.error('   3. Use console.error() for errors');
  console.error('   4. See vite.config.ts for logging policy\n');
  process.exit(1);
} else {
  console.log('✅ All console usage checks passed!');
  process.exit(0);
}
