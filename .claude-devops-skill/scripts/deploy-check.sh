#!/bin/bash

###############################################################################
# 🚀 PRE-DEPLOYMENT VALIDATION
# Comprehensive checks before production deployment
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🚀 PRE-DEPLOYMENT VALIDATION                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

CHECKS_PASSED=0
CHECKS_TOTAL=7

###############################################################################
# 1. GIT STATUS CHECK
###############################################################################

echo -e "${BLUE}[1/7] Git Status${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ FAIL: Uncommitted changes detected${NC}"
    git status --short
    exit 1
else
    echo -e "${GREEN}✅ PASS: Working directory clean${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
echo ""

###############################################################################
# 2. BRANCH CHECK
###############################################################################

echo -e "${BLUE}[2/7] Branch Check${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Check if on main/master
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
    echo -e "${GREEN}✅ PASS: On main branch${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Not on main branch${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
echo ""

###############################################################################
# 3. DEPENDENCIES CHECK
###############################################################################

echo -e "${BLUE}[3/7] Dependencies${NC}"
if npm ci --dry-run > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Dependencies are up to date${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Dependencies out of sync${NC}"
    echo "Run 'npm ci' to sync dependencies"
    exit 1
fi
echo ""

###############################################################################
# 4. PRODUCTION BUILD
###############################################################################

echo -e "${BLUE}[4/7] Production Build${NC}"
if npm run build; then
    echo -e "${GREEN}✅ PASS: Production build successful${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))

    # Check build output
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ FAIL: dist/ directory not found${NC}"
        exit 1
    fi

    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "Build size: $BUILD_SIZE"
else
    echo -e "${RED}❌ FAIL: Production build failed${NC}"
    exit 1
fi
echo ""

###############################################################################
# 5. CRITICAL TESTS
###############################################################################

echo -e "${BLUE}[5/7] Critical Tests${NC}"
if npm run test:ci; then
    echo -e "${GREEN}✅ PASS: All tests passed${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Tests failed${NC}"
    exit 1
fi
echo ""

###############################################################################
# 6. SECURITY AUDIT
###############################################################################

echo -e "${BLUE}[6/7] Security Audit${NC}"
if npm audit --audit-level=high --production; then
    echo -e "${GREEN}✅ PASS: No high/critical vulnerabilities${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Security vulnerabilities found${NC}"
    echo "Fix vulnerabilities before deploying"
    exit 1
fi
echo ""

###############################################################################
# 7. ENVIRONMENT VALIDATION
###############################################################################

echo -e "${BLUE}[7/7] Environment Validation${NC}"

# Check for .env.example
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}⚠️  WARNING: .env.example not found${NC}"
else
    echo "✓ .env.example exists"
fi

# Verify public env vars
if npm run verify:env:public; then
    echo -e "${GREEN}✅ PASS: Environment validated${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Environment validation failed${NC}"
    exit 1
fi
echo ""

###############################################################################
# DEPLOYMENT CHECKLIST
###############################################################################

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   DEPLOYMENT CHECKLIST                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo "Before deploying, verify:"
echo ""
echo "[ ] Environment variables set in production"
echo "[ ] Database migrations run"
echo "[ ] Supabase functions deployed"
echo "[ ] CDN cache cleared (if applicable)"
echo "[ ] Monitoring/alerts configured"
echo "[ ] Rollback plan ready"
echo "[ ] Stakeholders notified"
echo ""

echo -e "${GREEN}Automated checks: $CHECKS_PASSED/$CHECKS_TOTAL passed${NC}\n"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║         🚀 READY FOR DEPLOYMENT                         ║"
    echo "║            All checks passed!                            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    exit 0
else
    echo -e "${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
    echo "$((CHECKS_TOTAL - CHECKS_PASSED)) checks failed"
    exit 1
fi
