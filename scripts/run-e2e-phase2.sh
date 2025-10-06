#!/bin/bash
set -e

##############################################################################
# Phase 2 Production Gate - E2E Test Execution Script
#
# Runs comprehensive E2E tests against staging preview with strict assertions
# Generates HTML report, artifacts, and Phase 2 gate validation
##############################################################################

echo "🚀 Phase 2 Production Gate - E2E Test Suite"
echo "=============================================="

# Check if E2E_BASE_URL is set
if [ -z "$E2E_BASE_URL" ]; then
  echo "❌ ERROR: E2E_BASE_URL environment variable not set"
  echo "Usage: E2E_BASE_URL=https://your-app.lovable.app npm run test:e2e:phase2"
  exit 1
fi

echo "📍 Target URL: $E2E_BASE_URL"
echo ""

# Create artifacts directory
mkdir -p artifacts/e2e

# Run Playwright tests
echo "🧪 Running E2E test suite..."
echo ""

npx playwright test \
  --reporter=html \
  --reporter=list \
  --reporter=json \
  --reporter=junit \
  tests/e2e/phase2-gate.spec.ts \
  tests/security/embed-gate.spec.ts \
  tests/security/production-readiness.spec.ts \
  tests/e2e/security-validation.spec.ts

EXIT_CODE=$?

echo ""
echo "=============================================="

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Phase 2 Gate: ALL TESTS PASSED"
  echo ""
  echo "📊 Artifacts:"
  echo "   - HTML Report: artifacts/e2e/html-report/index.html"
  echo "   - JSON Results: artifacts/e2e/test-results.json"
  echo "   - JUnit XML: artifacts/e2e/junit.xml"
  echo ""
  echo "📝 Next Steps:"
  echo "   1. Review HTML report"
  echo "   2. Check trace files for any warnings"
  echo "   3. Update docs/PreProd/Phase2-Test-Report.md"
  echo "   4. Approve Phase 2 gate"
  echo ""
  echo "🎯 Commands:"
  echo "   npx playwright show-report artifacts/e2e/html-report"
else
  echo "❌ Phase 2 Gate: TESTS FAILED"
  echo ""
  echo "📊 Artifacts:"
  echo "   - HTML Report: artifacts/e2e/html-report/index.html"
  echo "   - Screenshots: artifacts/e2e/test-results/**/screenshots/"
  echo "   - Videos: artifacts/e2e/test-results/**/videos/"
  echo "   - Traces: artifacts/e2e/test-results/**/traces/"
  echo ""
  echo "🔍 Debug Commands:"
  echo "   npx playwright show-report artifacts/e2e/html-report"
  echo "   npx playwright show-trace artifacts/e2e/test-results/.../trace.zip"
  echo ""
  echo "⚠️  DO NOT PROCEED TO PRODUCTION"
  echo ""
fi

exit $EXIT_CODE
