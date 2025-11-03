#!/bin/bash

###############################################################################
# 🔒 SECURITY VULNERABILITY SCAN
# Comprehensive security analysis and vulnerability detection
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
echo "║              🔒 SECURITY VULNERABILITY SCAN                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

ISSUES_FOUND=0

###############################################################################
# 1. NPM AUDIT
###############################################################################

echo -e "${BLUE}[1/6] NPM Security Audit${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm audit --json > /tmp/npm-audit.json 2>&1; then
    echo -e "${GREEN}✅ No vulnerabilities found${NC}"
else
    # Parse audit results
    CRITICAL=$(cat /tmp/npm-audit.json | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
    HIGH=$(cat /tmp/npm-audit.json | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")
    MODERATE=$(cat /tmp/npm-audit.json | grep -o '"moderate":[0-9]*' | grep -o '[0-9]*' || echo "0")
    LOW=$(cat /tmp/npm-audit.json | grep -o '"low":[0-9]*' | grep -o '[0-9]*' || echo "0")

    echo -e "${RED}Vulnerabilities found:${NC}"
    echo "  Critical: $CRITICAL"
    echo "  High:     $HIGH"
    echo "  Moderate: $MODERATE"
    echo "  Low:      $LOW"

    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        echo -e "\n${RED}⚠️  CRITICAL/HIGH vulnerabilities must be fixed!${NC}"
        ISSUES_FOUND=1
    fi

    echo -e "\nRun 'npm audit fix' to automatically fix issues"
fi

###############################################################################
# 2. SECRETS DETECTION
###############################################################################

echo -e "\n${BLUE}[2/6] Secrets Detection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SECRETS_FOUND=0

# Check for hardcoded API keys
echo "🔍 Scanning for API keys..."
if grep -rE "api[_-]?key[\"']?\s*[:=]\s*[\"'][A-Za-z0-9]{20,}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ Potential API keys found in source code${NC}"
    SECRETS_FOUND=1
    ISSUES_FOUND=1
fi

# Check for hardcoded passwords
echo "🔍 Scanning for passwords..."
if grep -rE "password[\"']?\s*[:=]\s*[\"'][^\"']{8,}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "password:" | grep -v "// "; then
    echo -e "${RED}❌ Potential hardcoded passwords found${NC}"
    SECRETS_FOUND=1
    ISSUES_FOUND=1
fi

# Check for AWS keys
echo "🔍 Scanning for AWS credentials..."
if grep -rE "AKIA[0-9A-Z]{16}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ Potential AWS access keys found${NC}"
    SECRETS_FOUND=1
    ISSUES_FOUND=1
fi

# Check for private keys
echo "🔍 Scanning for private keys..."
if grep -rE "BEGIN.*PRIVATE KEY" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ Potential private keys found${NC}"
    SECRETS_FOUND=1
    ISSUES_FOUND=1
fi

# Check for JWT secrets
echo "🔍 Scanning for JWT secrets..."
if grep -rE "jwt[_-]?secret[\"']?\s*[:=]\s*[\"'][^\"']{10,}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ Potential JWT secrets found${NC}"
    SECRETS_FOUND=1
    ISSUES_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious secrets detected${NC}"
fi

###############################################################################
# 3. AUTHENTICATION & AUTHORIZATION
###############################################################################

echo -e "\n${BLUE}[3/6] Authentication & Authorization${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for client-side authentication
echo "🔍 Checking for client-side auth anti-patterns..."

# Check for localStorage token storage
if grep -r "localStorage.*token\|localStorage.*jwt" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Tokens stored in localStorage (consider httpOnly cookies)${NC}"
fi

# Check for proper RLS usage in Supabase queries
if grep -r "supabase\.from" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5; then
    echo "ℹ️  Supabase queries found - ensure RLS policies are enabled"
fi

# Check for .auth checks
AUTH_CHECKS=$(grep -r "\.auth\|useAuth\|getSession" src/ --include="*.ts" --include="*.tsx" | wc -l || echo "0")
echo "📊 Authentication checks: $AUTH_CHECKS instances"

echo -e "${GREEN}✅ Authentication patterns reviewed${NC}"

###############################################################################
# 4. DANGEROUS FUNCTIONS
###############################################################################

echo -e "\n${BLUE}[4/6] Dangerous Functions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DANGEROUS_FOUND=0

# dangerouslySetInnerHTML
echo "🔍 Checking for dangerouslySetInnerHTML..."
DANGEROUS_HTML=$(grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" | wc -l || echo "0")
if [ "$DANGEROUS_HTML" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $DANGEROUS_HTML uses of dangerouslySetInnerHTML (XSS risk)${NC}"
    DANGEROUS_FOUND=1
fi

# eval() usage
echo "🔍 Checking for eval()..."
if grep -r "\beval\s*(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ eval() found (code injection risk)${NC}"
    DANGEROUS_FOUND=1
    ISSUES_FOUND=1
fi

# Function constructor
echo "🔍 Checking for Function constructor..."
if grep -r "new Function" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ Function constructor found (code injection risk)${NC}"
    DANGEROUS_FOUND=1
    ISSUES_FOUND=1
fi

# document.write
echo "🔍 Checking for document.write..."
if grep -r "document\.write" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  document.write found (potential XSS)${NC}"
    DANGEROUS_FOUND=1
fi

if [ "$DANGEROUS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ No dangerous functions detected${NC}"
fi

###############################################################################
# 5. DEPENDENCY LICENSES
###############################################################################

echo -e "\n${BLUE}[5/6] Dependency License Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for problematic licenses
if command -v npx &> /dev/null; then
    echo "🔍 Scanning licenses..."
    npx license-checker --summary 2>/dev/null || echo "Install license-checker: npm i -g license-checker"
else
    echo -e "${YELLOW}⚠️  npx not available, skipping license check${NC}"
fi

###############################################################################
# 6. ENVIRONMENT SECURITY
###############################################################################

echo -e "\n${BLUE}[6/6] Environment Security${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for .env in git
if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}❌ .env file tracked in git (CRITICAL)${NC}"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ .env not tracked in git${NC}"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo -e "${GREEN}✅ .env in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .env not explicitly in .gitignore${NC}"
    fi

    if grep -q "node_modules" .gitignore; then
        echo -e "${GREEN}✅ node_modules in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  node_modules not in .gitignore${NC}"
    fi
fi

# Check for exposed .env.example
if [ -f ".env.example" ]; then
    echo "🔍 Checking .env.example for secrets..."
    if grep -E "=[A-Za-z0-9]{20,}" .env.example 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Potential secrets in .env.example${NC}"
    else
        echo -e "${GREEN}✅ .env.example looks clean${NC}"
    fi
fi

###############################################################################
# SECURITY CHECKLIST
###############################################################################

echo -e "\n${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   SECURITY CHECKLIST                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo "Manual verification required:"
echo ""
echo "[ ] HTTPS enforced in production"
echo "[ ] CSP headers configured"
echo "[ ] CORS properly configured"
echo "[ ] Rate limiting implemented"
echo "[ ] Input validation on all endpoints"
echo "[ ] Output sanitization (XSS prevention)"
echo "[ ] SQL injection prevention (use parameterized queries)"
echo "[ ] RLS policies enabled in Supabase"
echo "[ ] Session management secure (httpOnly cookies)"
echo "[ ] MFA available for admin users"
echo "[ ] Security headers (Helmet.js)"
echo "[ ] Dependency updates scheduled"
echo "[ ] Security incident response plan"
echo "[ ] Regular security audits scheduled"
echo ""

###############################################################################
# SUMMARY
###############################################################################

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      SCAN SUMMARY                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║      ✅ NO CRITICAL SECURITY ISSUES FOUND               ║"
    echo "║         Continue with manual verification                ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    exit 0
else
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║      ❌ SECURITY ISSUES FOUND                           ║"
    echo "║         Fix critical issues before deployment            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    exit 1
fi
