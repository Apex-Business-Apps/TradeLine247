#!/bin/bash

###############################################################################
# 🔍 COMPREHENSIVE CODEBASE AUDIT
# Runs complete quality, security, and performance analysis
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🚀 COMPREHENSIVE DEVOPS AUDIT                     ║"
echo "║                Code Genius Quality Analysis                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

###############################################################################
# 1. TYPESCRIPT TYPE SAFETY
###############################################################################

echo -e "\n${BLUE}[1/10] TypeScript Type Safety${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run typecheck 2>&1 | tee /tmp/typecheck.log; then
    echo -e "${GREEN}✅ PASS: No TypeScript errors${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: TypeScript errors detected${NC}"
    FAILED=$((FAILED + 1))
fi

# Check for 'any' types
ANY_COUNT=$(grep -r ":\s*any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Found $ANY_COUNT 'any' types - should be zero${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Strict typing: Zero 'any' types${NC}"
fi

###############################################################################
# 2. ESLINT CODE QUALITY
###############################################################################

echo -e "\n${BLUE}[2/10] ESLint Code Quality${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run lint 2>&1 | tee /tmp/lint.log; then
    echo -e "${GREEN}✅ PASS: No ESLint errors or warnings${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: ESLint issues detected${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 3. UNIT TEST COVERAGE
###############################################################################

echo -e "\n${BLUE}[3/10] Unit Test Coverage${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run test:ci 2>&1 | tee /tmp/test.log; then
    COVERAGE=$(grep -oP 'All files.*?\K\d+\.\d+' /tmp/test.log | head -1 || echo "0")
    if (( $(echo "$COVERAGE >= 80" | bc -l) )); then
        echo -e "${GREEN}✅ PASS: Coverage at ${COVERAGE}% (target: >80%)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING: Coverage at ${COVERAGE}% (target: >80%)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ FAIL: Tests failed${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 4. SECURITY VULNERABILITIES
###############################################################################

echo -e "\n${BLUE}[4/10] Security Vulnerabilities${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm audit --audit-level=moderate 2>&1 | tee /tmp/audit.log; then
    echo -e "${GREEN}✅ PASS: No moderate+ vulnerabilities${NC}"
    PASSED=$((PASSED + 1))
else
    CRITICAL=$(grep -oP '\d+\s+critical' /tmp/audit.log | grep -oP '^\d+' || echo "0")
    HIGH=$(grep -oP '\d+\s+high' /tmp/audit.log | grep -oP '^\d+' || echo "0")

    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        echo -e "${RED}❌ FAIL: Critical: $CRITICAL, High: $HIGH${NC}"
        FAILED=$((FAILED + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING: Moderate vulnerabilities found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

###############################################################################
# 5. PRODUCTION BUILD
###############################################################################

echo -e "\n${BLUE}[5/10] Production Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run build 2>&1 | tee /tmp/build.log; then
    echo -e "${GREEN}✅ PASS: Production build successful${NC}"
    PASSED=$((PASSED + 1))

    # Check bundle size
    if [ -d "dist" ]; then
        BUNDLE_SIZE=$(du -sh dist | cut -f1)
        echo -e "📦 Bundle size: ${BUNDLE_SIZE}"
    fi
else
    echo -e "${RED}❌ FAIL: Build failed${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 6. APP VERIFICATION
###############################################################################

echo -e "\n${BLUE}[6/10] App Verification Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run verify:app 2>&1 | tee /tmp/verify-app.log; then
    echo -e "${GREEN}✅ PASS: App verification successful${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: App verification failed${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 7. ICON INTEGRITY
###############################################################################

echo -e "\n${BLUE}[7/10] Icon Integrity${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run verify:icons 2>&1 | tee /tmp/verify-icons.log; then
    echo -e "${GREEN}✅ PASS: Icon verification successful${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Icon verification failed${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 8. ENVIRONMENT VARIABLES
###############################################################################

echo -e "\n${BLUE}[8/10] Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run verify:env:public 2>&1 | tee /tmp/verify-env.log; then
    echo -e "${GREEN}✅ PASS: Environment variables validated${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Environment variable issues${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# 9. CODE COMPLEXITY
###############################################################################

echo -e "\n${BLUE}[9/10] Code Complexity Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find large files (potential complexity issues)
LARGE_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs wc -l 2>/dev/null | sort -rn | head -5 || true)
echo "Largest files (lines of code):"
echo "$LARGE_FILES"

# Count TODO/FIXME comments
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $TODO_COUNT TODO/FIXME comments${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No TODO/FIXME comments${NC}"
fi

echo -e "${GREEN}✅ PASS: Complexity analysis complete${NC}"
PASSED=$((PASSED + 1))

###############################################################################
# 10. SECRETS DETECTION
###############################################################################

echo -e "\n${BLUE}[10/10] Secrets Detection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for common secret patterns
SECRETS_FOUND=0

# API keys
if grep -r "api[_-]key\s*=\s*['\"][^'\"]\+" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}⚠️  Potential API key found in source code${NC}"
    SECRETS_FOUND=1
fi

# Hardcoded tokens
if grep -r "token\s*=\s*['\"][A-Za-z0-9]\{20,\}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}⚠️  Potential hardcoded token found${NC}"
    SECRETS_FOUND=1
fi

# Private keys
if grep -r "PRIVATE[_-]KEY" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}⚠️  Potential private key reference found${NC}"
    SECRETS_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No obvious secrets detected${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL: Potential secrets found${NC}"
    FAILED=$((FAILED + 1))
fi

###############################################################################
# SUMMARY
###############################################################################

echo -e "\n${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      AUDIT SUMMARY                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

TOTAL=$((PASSED + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

echo -e "Checks Passed:   ${GREEN}$PASSED${NC}"
echo -e "Checks Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings:        ${YELLOW}$WARNINGS${NC}"
echo -e "Overall Score:   ${BLUE}$SCORE%${NC}"

if [ "$SCORE" -ge 90 ]; then
    echo -e "\n${GREEN}🏆 EXCELLENT: Production-ready quality!${NC}"
    exit 0
elif [ "$SCORE" -ge 70 ]; then
    echo -e "\n${YELLOW}⚠️  GOOD: Minor issues to address${NC}"
    exit 0
else
    echo -e "\n${RED}❌ NEEDS WORK: Critical issues must be fixed${NC}"
    exit 1
fi
