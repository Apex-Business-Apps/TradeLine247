#!/usr/bin/env node

/**
 * Verify Public Environment Variables
 *
 * This script checks that required VITE_* environment variables are defined.
 * These must be set in your Vercel project settings as public environment variables:
 *
 * 1. VITE_SUPABASE_URL - Your Supabase project URL
 * 2. VITE_SUPABASE_ANON_KEY - Your Supabase anon/public key
 *
 * In Vercel:
 *   - Navigate to Project Settings → Environment Variables
 *   - Add both variables for all environments (Production, Preview, Development)
 *   - Ensure they are NOT marked as "Secret" (they need to be available to the build)
 *
 * Without these variables, the build will fail.
 */

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = required.filter((key) => {
  const value = process.env[key];
  return typeof value !== "string" || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error(`[verify-public-env] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log("[verify-public-env] All required public environment variables are set.");
