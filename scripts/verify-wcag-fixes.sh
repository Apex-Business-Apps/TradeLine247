#!/bin/bash
set -e

echo "========================================================================"
echo "WCAG AA Color Contrast Fixes - Local Verification Script"
echo "========================================================================"
echo ""
echo "This script will verify all WCAG color contrast fixes are working."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking out the branch...${NC}"
git fetch origin
git checkout claude/fix-header-contrast-wcag-011CUrD8AJ5sHnwh1JRcHvJs
git pull origin claude/fix-header-contrast-wcag-011CUrD8AJ5sHnwh1JRcHvJs
echo -e "${GREEN}✓ Branch checked out${NC}"
echo ""

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 3: Running color contrast analysis...${NC}"
if node scripts/analyze-contrast.js; then
  echo -e "${GREEN}✓ Color contrast analysis PASSED${NC}"
else
  echo -e "${RED}✗ Color contrast analysis FAILED${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 4: Running WCAG compliance tests...${NC}"
if bash scripts/test-wcag-compliance.sh; then
  echo -e "${GREEN}✓ WCAG compliance tests PASSED${NC}"
else
  echo -e "${RED}✗ WCAG compliance tests FAILED${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 5: Building application...${NC}"
if npm run build; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 6: Starting preview server...${NC}"
echo "Starting server on http://localhost:4173"
echo "Press Ctrl+C to stop when done testing"
echo ""
echo -e "${YELLOW}Manual Testing Checklist:${NC}"
echo "  1. Open http://localhost:4173 in your browser"
echo "  2. Check header 'Home' button - should be dark orange with white text"
echo "  3. Check 'Login' button - should be dark green with white text"
echo "  4. Toggle dark mode - buttons should maintain good contrast"
echo "  5. Check links - should be dark orange (not bright orange)"
echo ""
npm run preview
