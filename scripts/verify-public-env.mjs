#!/usr/bin/env node

const REQUIRED_PUBLIC_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const missing = REQUIRED_PUBLIC_ENV.filter((name) => !process.env[name]);

if (missing.length === 0) {
  console.info('[verify-public-env] All required env vars are present.');
  process.exit(0);
}

// Default to soft failure (warning only) for CI/preview builds
// Only hard fail if explicitly set to '1'
const hardFail = process.env.REQUIRE_PUBLIC_ENV === '1';
const msg = `[verify-public-env] Missing required environment variables: ${missing.join(', ')}`;

if (hardFail) {
  console.error(msg + ' (REQUIRE_PUBLIC_ENV=1, failing build)');
  process.exit(1);
} else {
  console.warn(msg + ' (soft warning only; continuing for CI/preview builds)');
  // Exit with success code to allow builds to continue
  process.exit(0);
}
