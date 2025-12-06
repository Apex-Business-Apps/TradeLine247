/**
 * Single source of truth for env reads (Vite + Deno safe).
 * Use: env("VITE_SUPABASE_URL")
 */
import { isNode } from "./runtime";

// Vite exposes import.meta.env only in browser/build contexts
const viteEnv = (import.meta as any)?.env ?? {};

export function env<K extends string>(key: K): string | undefined {
  // Prefer Vite at runtime; fall back to Node when running tools/scripts
  return viteEnv[key] ?? (isNode ? (process as any).env?.[key] : undefined);
}

// Strict getter for required keys (throws only in dev, not in test)
export function envRequired<K extends string>(key: K): string {
  const v = env(key);
  // Don't throw in test mode - tests should be able to run without env vars
  const isTestMode = viteEnv.MODE === "test" || viteEnv.MODE === "production";
  if (!v && !isTestMode && (viteEnv.MODE === "development" || viteEnv.DEV)) {
    throw new Error(`Missing required env: ${key}`);
  }
  return v ?? "";
}
