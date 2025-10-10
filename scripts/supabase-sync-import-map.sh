#!/usr/bin/env bash
set -euo pipefail

STD_VER="0.177.0"
ZOD_VER="v3.22.4"
SUPABASE_JS_VER="2.39.3"

echo "🔄 Syncing per-function import maps and locks..."

for d in supabase/functions/*/ ; do
  func_name=$(basename "$d")
  echo "  📦 Processing $func_name..."
  
  cat > "${d}import_map.json" <<JSON
{
  "imports": {
    "std/": "https://deno.land/std@${STD_VER}/",
    "zod": "https://deno.land/x/zod@${ZOD_VER}/mod.ts",
    "supabase": "https://esm.sh/@supabase/supabase-js@${SUPABASE_JS_VER}?target=deno&bundle&dts"
  }
}
JSON

  cat > "${d}deno.json" <<JSON
{
  "importMap": "./import_map.json",
  "lock": "./deno.lock",
  "nodeModulesDir": false,
  "compilerOptions": {
    "strict": true,
    "lib": ["dom", "deno.ns", "deno.window"]
  }
}
JSON

  entry="${d}index.ts"
  if [[ -f "$entry" ]]; then
    echo "    🔒 Generating lockfile..."
    deno cache -q --lock="${d}deno.lock" --lock-write "$entry" 2>/dev/null || {
      echo "    ⚠️  Warning: Could not generate lock for $func_name (dependencies may need network)"
    }
  fi
done

echo "✅ Per-function import maps and locks synced."
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git diff supabase/functions/"
echo "   2. Test locally: supabase functions serve <function-name>"
echo "   3. Deploy: supabase functions deploy <function-name>"
echo "   4. Commit: git add supabase/functions/*/import_map.json supabase/functions/*/deno.json supabase/functions/*/deno.lock"
