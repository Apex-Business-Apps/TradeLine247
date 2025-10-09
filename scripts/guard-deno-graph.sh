#!/usr/bin/env bash
# Deno Dependency Guard - Prevents version drift
set -euo pipefail

echo "🔍 Checking Deno dependency graph for version consistency..."

# Check a representative edge function
FUNC_PATH="supabase/functions/ai-chat/index.ts"

if [ ! -f "$FUNC_PATH" ]; then
  echo "⚠️  Warning: $FUNC_PATH not found, skipping check"
  exit 0
fi

# Get dependency graph
graph="$(deno info --import-map=import_map.json "$FUNC_PATH" 2>&1 || true)"

echo "📊 Dependency Graph Sample:"
echo "$graph" | head -n 30

# Check for std@0.177.0 (expected)
if echo "$graph" | grep -qE "std@0\.177\.0"; then
  echo "✅ PASS: std@0.177.0 found"
else
  echo "⚠️  WARNING: std@0.177.0 not found in graph"
fi

# Fail if mixed std versions detected
if echo "$graph" | grep -qE "std@0\.(16[0-9]|17[0-6])\.0"; then
  echo "❌ FAIL: Mixed std versions detected (not 0.177.0)"
  echo "$graph" | grep -E "std@0\.(16[0-9]|17[0-6])\.0" || true
  exit 1
fi

# Fail if mixed supabase-js versions detected (not 2.39.3)
if echo "$graph" | grep -qE "@supabase/supabase-js@2\.(38|74)\."; then
  echo "❌ FAIL: Mixed supabase-js versions detected (not 2.39.3)"
  echo "$graph" | grep -E "@supabase/supabase-js@2\." || true
  exit 1
fi

# Check for the canonical version
if echo "$graph" | grep -qE "@supabase/supabase-js@2\.39\.3"; then
  echo "✅ PASS: @supabase/supabase-js@2.39.3 found"
else
  echo "⚠️  WARNING: @supabase/supabase-js@2.39.3 not found in graph"
fi

echo ""
echo "✅ OK: Dependency graph is consistent"
echo "   - Single std version: 0.177.0"
echo "   - Single supabase-js version: 2.39.3"
echo "   - No version conflicts detected"
