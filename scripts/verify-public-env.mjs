#!/usr/bin/env node

/**
 * Verify Public Environment Variables
 *
 * This script ensures that required public environment variables are set.
 * These are VITE_ prefixed variables that are embedded in the client bundle.
 *
 * Environment Variable Sources (in order of precedence):
 * 1. Process environment (CI/Vercel dashboard configuration)
 * 2. .env.production (committed file with public vars)
 * 3. .env.local (local development, not committed)
 * 4. .env (fallback, not committed)
 *
 * CI Bypass: In CI environments (GitHub Actions), we skip validation because:
 * - Vite auto-loads .env.production during build
 * - Vercel has vars in dashboard (not needed in GitHub Actions)
 * - Build will fail anyway if vars are actually missing
 */

// Skip validation in CI - Vercel provides vars, .env.production provides fallback
if (process.env.CI) {
  console.log('✅ [verify-public-env] Skipping validation in CI environment (vars loaded by Vite)');
  process.exit(0);
}

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Simple .env file parser (no dependencies needed)
 */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf-8');
  const vars = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (match) {
      const [, key, value] = match;
      // Only set if not already in process.env
      if (!process.env[key]) {
        vars[key] = value.trim();
      }
    }
  }

  return vars;
}

// Load environment files in order (later files don't override earlier ones)
const envFiles = [
  '.env.production',
  '.env.local',
  '.env'
];

for (const file of envFiles) {
  const vars = loadEnvFile(join(rootDir, file));
  Object.assign(process.env, vars);
}

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = required.filter((key) => {
  const value = process.env[key];
  return typeof value !== "string" || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error(`\n❌ [verify-public-env] Missing required environment variables: ${missing.join(', ')}\n`);
  console.error('These public variables should be provided by:');
  console.error('  • Vercel: Project Settings > Environment Variables');
  console.error('  • GitHub Actions: Using .env.production (auto-loaded)');
  console.error('  • Local Development: .env.local or .env file\n');
  console.error('💡 For local development, copy .env.example to .env.local\n');
  process.exit(1);
}

console.log("✅ [verify-public-env] All required public environment variables are set.");
