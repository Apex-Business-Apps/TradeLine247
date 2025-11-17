#!/usr/bin/env node

/**
 * Check Required Files
 *
 * This script verifies that critical files exist before building.
 * It fails fast if essential files are missing, preventing wasted build time.
 *
 * Required files:
 *   - src/integrations/supabase/client.ts - Supabase client initialization
 *   - src/App.tsx - Main application component
 *   - src/main.tsx - Application entry point
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const requiredFiles = [
  'src/integrations/supabase/client.ts',
  'src/App.tsx',
  'src/main.tsx',
];

let hasErrors = false;

console.log('🔍 Checking for required files...\n');

for (const file of requiredFiles) {
  const filePath = resolve(__dirname, '..', file);

  if (!existsSync(filePath)) {
    console.error(`❌ MISSING: ${file}`);
    console.error(`   Expected at: ${filePath}\n`);
    hasErrors = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

if (hasErrors) {
  console.error('\n❌ Build aborted: Required files are missing');
  console.error('   Please ensure all critical files exist before building.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required files found');
  process.exit(0);
}
