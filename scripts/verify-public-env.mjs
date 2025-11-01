#!/usr/bin/env node

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
