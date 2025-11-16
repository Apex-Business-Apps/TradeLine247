#!/usr/bin/env node

// Skip validation in CI environments - Vercel injects env vars at build time
if (process.env.CI === 'true' || process.env.VERCEL === '1') {
  console.log("[verify-public-env] Skipping validation in CI/Vercel - env vars injected at build time");
  process.exit(0);
}

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
