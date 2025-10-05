#!/bin/bash

# Security Pre-Deployment Check
# Run this before EVERY deployment to production

set -e

echo "🔒 Security Check Starting..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check for hardcoded secrets
echo "1️⃣  Checking for hardcoded secrets..."
if grep -r "sk_live_" src/ 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: Hardcoded Stripe keys found!${NC}"
  ERRORS=$((ERRORS+1))
elif grep -r "AKIA" src/ 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: Hardcoded AWS keys found!${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ No hardcoded secrets detected${NC}"
fi
echo ""

# 2. Check RLS policies have anonymous blocks
echo "2️⃣  Verifying RLS anonymous blocks..."
SENSITIVE_TABLES=("profiles" "leads" "credit_applications" "dealerships" "documents" "integrations" "webhooks" "consents" "encryption_keys")

for table in "${SENSITIVE_TABLES[@]}"; do
  if ! grep -q "Block anonymous access.*$table" supabase/migrations/*.sql 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: No anonymous block found for table '$table'${NC}"
    ERRORS=$((ERRORS+1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All sensitive tables have anonymous blocks${NC}"
fi
echo ""

# 3. Verify edge function JWT settings
echo "3️⃣  Checking edge function security..."
if [ ! -f "supabase/config.toml" ]; then
  echo -e "${RED}❌ CRITICAL: supabase/config.toml missing!${NC}"
  ERRORS=$((ERRORS+1))
else
  # Check that sensitive functions require JWT
  PROTECTED_FUNCTIONS=("store-encryption-key" "retrieve-encryption-key" "store-integration-credentials")
  
  for func in "${PROTECTED_FUNCTIONS[@]}"; do
    if grep -A 1 "\[$func\]" supabase/config.toml | grep -q "verify_jwt = false"; then
      echo -e "${RED}❌ CRITICAL: '$func' has JWT verification disabled!${NC}"
      ERRORS=$((ERRORS+1))
    fi
  done
  
  if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Edge function security configured correctly${NC}"
  fi
fi
echo ""

# 4. Check encryption implementation
echo "4️⃣  Verifying encryption logic..."
if ! grep -q "fieldEncryptionData\[field\] = { key, iv }" src/lib/security/creditEncryption.ts; then
  echo -e "${RED}❌ CRITICAL: Encryption key reuse detected!${NC}"
  echo -e "${YELLOW}   Each field must have unique key + IV${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ Encryption uses unique keys per field${NC}"
fi
echo ""

# 5. Verify rate limiting exists
echo "5️⃣  Checking rate limiting..."
if ! grep -q "check_key_retrieval_rate_limit" supabase/functions/retrieve-encryption-key/index.ts; then
  echo -e "${RED}❌ CRITICAL: Rate limiting missing from key retrieval!${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ Rate limiting implemented${NC}"
fi
echo ""

# 6. Check for exposed encryption keys in client code
echo "6️⃣  Scanning for exposed encryption keys..."
if grep -r "key_encrypted" src/components/ 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: Encryption keys may be exposed in components!${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ No encryption key exposure in UI${NC}"
fi
echo ""

# 7. Verify IP capture has error handling
echo "7️⃣  Checking IP capture error handling..."
if grep -q "catch (ipError)" src/components/CreditApp/CreditApplicationForm.tsx; then
  echo -e "${GREEN}✅ IP capture has graceful degradation${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: IP capture may block consent submission${NC}"
  ERRORS=$((ERRORS+1))
fi
echo ""

# Final verdict
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ SECURITY CHECK PASSED${NC}"
  echo -e "${GREEN}Deployment authorized.${NC}"
  exit 0
else
  echo -e "${RED}❌ SECURITY CHECK FAILED${NC}"
  echo -e "${RED}Found $ERRORS critical issue(s).${NC}"
  echo -e "${YELLOW}Fix issues before deploying to production.${NC}"
  exit 1
fi
