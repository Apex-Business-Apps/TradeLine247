#!/bin/bash
# Security Header Verification Script
# Deterministic verification for production and preview environments

set -euo pipefail

# Configuration
CANONICAL="https://www.autorepai.ca"
PREVIEW_URL="${PREVIEW_URL:-}" # Set to preview URL if testing preview env

# Determine which URL to test
if [ -n "$PREVIEW_URL" ]; then
  BASE_URL="$PREVIEW_URL"
  ENV="PREVIEW"
else
  BASE_URL="$CANONICAL"
  ENV="PRODUCTION"
fi

echo "=========================================="
echo "Security Header Verification"
echo "Environment: $ENV"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

ERRORS=0

# Test paths to verify
PATHS=("/" "/404" "/auth" "/dashboard")

for path in "${PATHS[@]}"; do
  url="${BASE_URL}${path}"
  echo ">>> Testing: $url"
  
  # Fetch headers
  headers=$(curl -sI "$url" 2>&1 || echo "CURL_FAILED")
  
  if [[ "$headers" == "CURL_FAILED" ]]; then
    echo "❌ FAIL: Could not reach $url"
    ERRORS=$((ERRORS + 1))
    echo ""
    continue
  fi
  
  echo "$headers"
  echo ""
  
  # CHECK 1: X-Frame-Options MUST NOT be present
  if echo "$headers" | grep -iq '^X-Frame-Options:'; then
    echo "❌ FAIL: X-Frame-Options header present (must be absent)"
    echo "   CSP frame-ancestors supersedes X-Frame-Options"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: X-Frame-Options absent (correct)"
  fi
  
  # CHECK 2: Content-Security-Policy MUST exist
  if ! echo "$headers" | grep -iq '^Content-Security-Policy:'; then
    echo "❌ FAIL: Content-Security-Policy header missing"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: Content-Security-Policy present"
    
    # CHECK 3: CSP must contain frame-ancestors directive
    csp_line=$(echo "$headers" | grep -i '^Content-Security-Policy:' | head -1)
    if ! echo "$csp_line" | grep -iq 'frame-ancestors'; then
      echo "❌ FAIL: CSP missing frame-ancestors directive"
      ERRORS=$((ERRORS + 1))
    else
      echo "✅ PASS: CSP contains frame-ancestors"
      
      # CHECK 4: Verify frame-ancestors content
      if echo "$csp_line" | grep -iq "frame-ancestors.*'self'"; then
        echo "✅ PASS: frame-ancestors includes 'self'"
      else
        echo "❌ FAIL: frame-ancestors missing 'self'"
        ERRORS=$((ERRORS + 1))
      fi
      
      if echo "$csp_line" | grep -iq "frame-ancestors.*autorepai.ca"; then
        echo "✅ PASS: frame-ancestors includes canonical domain"
      else
        echo "⚠️  WARN: frame-ancestors missing canonical domain"
      fi
      
      if [ "$ENV" = "PREVIEW" ]; then
        if echo "$csp_line" | grep -iq "frame-ancestors.*lovable"; then
          echo "✅ PASS: frame-ancestors includes Lovable domains (preview)"
        else
          echo "❌ FAIL: frame-ancestors missing Lovable domains (required in preview)"
          ERRORS=$((ERRORS + 1))
        fi
      fi
    fi
  fi
  
  # CHECK 5: Other security headers
  for header in "X-Content-Type-Options" "Referrer-Policy" "Strict-Transport-Security"; do
    if echo "$headers" | grep -iq "^${header}:"; then
      echo "✅ PASS: $header present"
    else
      echo "⚠️  WARN: $header missing"
    fi
  done
  
  echo "=========================================="
  echo ""
done

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "   Environment: $ENV"
  echo "   Tested paths: ${#PATHS[@]}"
  echo ""
  echo "Security posture: COMPLIANT"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  echo "   Errors found: $ERRORS"
  echo "   Environment: $ENV"
  echo ""
  echo "Action required: Fix header configuration"
  echo ""
  echo "References:"
  echo "  - MDN CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
  echo "  - MDN frame-ancestors: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors"
  echo "  - MDN X-Frame-Options (deprecated): https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"
  exit 1
fi
