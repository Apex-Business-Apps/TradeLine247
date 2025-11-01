#!/bin/bash

###############################################################################
# ✅ PRE-COMMIT QUALITY CHECK
# Fast quality checks suitable for pre-commit hooks
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Running pre-commit quality checks...${NC}\n"

###############################################################################
# 1. TYPESCRIPT TYPE CHECKING
###############################################################################

echo -e "${BLUE}[1/4] TypeScript Type Checking${NC}"
if npm run typecheck; then
    echo -e "${GREEN}✅ TypeScript: PASS${NC}\n"
else
    echo -e "${RED}❌ TypeScript: FAIL${NC}\n"
    exit 1
fi

###############################################################################
# 2. ESLINT
###############################################################################

echo -e "${BLUE}[2/4] ESLint${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ ESLint: PASS${NC}\n"
else
    echo -e "${RED}❌ ESLint: FAIL${NC}\n"
    exit 1
fi

###############################################################################
# 3. UNIT TESTS
###############################################################################

echo -e "${BLUE}[3/4] Unit Tests${NC}"
if npm run test; then
    echo -e "${GREEN}✅ Tests: PASS${NC}\n"
else
    echo -e "${RED}❌ Tests: FAIL${NC}\n"
    exit 1
fi

###############################################################################
# 4. VERIFICATION CHECKS
###############################################################################

echo -e "${BLUE}[4/4] Verification Checks${NC}"
VERIFY_FAILED=0

if ! npm run verify:env:public; then
    echo -e "${RED}❌ Environment verification failed${NC}"
    VERIFY_FAILED=1
fi

if [ $VERIFY_FAILED -eq 1 ]; then
    exit 1
fi

echo -e "${GREEN}✅ Verification: PASS${NC}\n"

###############################################################################
# SUCCESS
###############################################################################

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            ✅ ALL QUALITY CHECKS PASSED                 ║"
echo "║               Ready to commit!                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

exit 0
