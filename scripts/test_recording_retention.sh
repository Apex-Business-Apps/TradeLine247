#!/usr/bin/env bash
# Test recording retention and opt-out compliance
set -euo pipefail

BASE="${1:-${SUPABASE_URL:-https://<your-supabase-project>.supabase.co}}"
ANON_KEY="${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY to run this script}"

echo "=== PIPEDA Recording Compliance Tests ==="
echo ""

# Test 1: Check if disclosure includes purpose
echo "Test 1: Disclosure includes purpose statement"
echo "✅ Manual verification: Call voice-frontdoor and confirm disclosure says:"
echo "   'to improve service quality and keep accurate records'"
echo ""

# Test 2: Verify opt-out path prevents recording
echo "Test 2: Opt-out path prevents recording"
echo "✅ Manual verification: Call and say 'opt out', confirm no recordingSid"
echo ""

# Test 3: Test purge job manually
echo "Test 3: Manually trigger recording purge"
code=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/functions/v1/recording-purge" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json")

if [ "$code" = "200" ]; then
  echo "✅ Purge job executed successfully (HTTP $code)"
else
  echo "❌ Purge job failed (HTTP $code)"
fi
echo ""

# Test 4: Verify cron schedule exists
echo "Test 4: Verify cron schedule is active"
echo "ℹ️  Run this SQL query to check:"
echo "   SELECT * FROM cron.job WHERE jobname = 'recording-retention-purge';"
echo ""

# Test 5: Check privacy policy has call recording section
echo "Test 5: Privacy policy includes call recording section"
echo "✅ Visit /privacy#call-recording to verify disclosure"
echo ""

echo "=== Tests Complete ==="
echo ""
echo "Environment variables to set:"
echo "  ENV_RECORDING_RETENTION_DAYS (default: 30)"
echo ""
echo "Cron schedule:"
echo "  Daily at 3 AM UTC - purges recordings older than retention period"
