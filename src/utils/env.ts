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

// Strict getter for required keys (throws only in dev)
export function envRequired<K extends string>(key: K): string {
  const v = env(key);
  if (!v && (viteEnv.MODE === "development" || viteEnv.DEV)) {
    throw new Error(`Missing required env: ${key}`);
  }
  return v ?? "";
}
