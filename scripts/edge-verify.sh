#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Verifying edge function self-containment..."

miss=0
total=0

for d in supabase/functions/*/ ; do
  func_name=$(basename "$d")
  total=$((total + 1))
  
  echo "  📋 Checking $func_name..."
  
  if [[ ! -f "${d}import_map.json" ]]; then
    echo "    ❌ Missing ${d}import_map.json"
    miss=1
  fi
  
  if [[ ! -f "${d}deno.json" ]]; then
    echo "    ❌ Missing ${d}deno.json"
    miss=1
  fi
  
  if [[ ! -f "${d}deno.lock" ]]; then
    echo "    ⚠️  Missing ${d}deno.lock (will be generated on first cache)"
  fi
  
  if [[ ! -f "${d}index.ts" ]]; then
    echo "    ⚠️  Missing ${d}index.ts (expected entrypoint)"
  fi
done

echo ""
if [[ $miss -eq 0 ]]; then
  echo "✅ All $total edge functions are self-contained!"
  exit 0
else
  echo "❌ Some edge functions are missing required files."
  echo "Run: bash scripts/supabase-sync-import-map.sh"
  exit 1
fi
