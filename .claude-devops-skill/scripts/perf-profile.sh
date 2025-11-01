#!/bin/bash

###############################################################################
# ⚡ PERFORMANCE PROFILING
# Analyze bundle size, render performance, and optimization opportunities
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
echo "║              ⚡ PERFORMANCE PROFILING                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

###############################################################################
# 1. BUILD ANALYSIS
###############################################################################

echo -e "${BLUE}[1/5] Bundle Size Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build for production
npm run build

if [ -d "dist" ]; then
    echo -e "\n📦 Build Output:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Total size
    TOTAL_SIZE=$(du -sh dist | cut -f1)
    echo "Total bundle size: $TOTAL_SIZE"

    # Breakdown by file type
    echo -e "\n📊 Size by file type:"
    echo "JavaScript: $(find dist -name "*.js" -exec du -ch {} + 2>/dev/null | grep total | cut -f1 || echo '0')"
    echo "CSS:        $(find dist -name "*.css" -exec du -ch {} + 2>/dev/null | grep total | cut -f1 || echo '0')"
    echo "Images:     $(find dist -name "*.png" -o -name "*.jpg" -o -name "*.svg" -o -name "*.webp" | xargs du -ch 2>/dev/null | grep total | cut -f1 || echo '0')"
    echo "Fonts:      $(find dist -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" | xargs du -ch 2>/dev/null | grep total | cut -f1 || echo '0')"

    # Largest files
    echo -e "\n📏 Largest files:"
    find dist -type f -exec du -h {} + | sort -rh | head -10

    # Check for large files
    echo -e "\n⚠️  Files larger than 500KB:"
    find dist -type f -size +500k -exec du -h {} \; || echo "None found (good!)"
else
    echo -e "${RED}❌ dist/ directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

###############################################################################
# 2. DEPENDENCY ANALYSIS
###############################################################################

echo -e "\n${BLUE}[2/5] Dependency Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count dependencies
DEPS=$(node -e "console.log(Object.keys(require('./package.json').dependencies || {}).length)")
DEV_DEPS=$(node -e "console.log(Object.keys(require('./package.json').devDependencies || {}).length)")

echo "Production dependencies: $DEPS"
echo "Dev dependencies: $DEV_DEPS"
echo "Total: $((DEPS + DEV_DEPS))"

# Check for duplicate dependencies
echo -e "\n🔍 Checking for duplicate packages..."
if command -v npm ls &> /dev/null; then
    DUPES=$(npm ls 2>&1 | grep "deduped" | wc -l || echo "0")
    if [ "$DUPES" -gt 0 ]; then
        echo -e "${YELLOW}Found $DUPES deduplicated packages${NC}"
        echo "Consider running: npm dedupe"
    else
        echo -e "${GREEN}✅ No duplicate packages${NC}"
    fi
fi

# Outdated packages
echo -e "\n📦 Checking for outdated packages..."
npm outdated || echo -e "${GREEN}All packages up to date${NC}"

###############################################################################
# 3. CODE METRICS
###############################################################################

echo -e "\n${BLUE}[3/5] Code Metrics${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Lines of code
echo "📊 Lines of code:"
echo "TypeScript: $(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo '0')"
echo "CSS:        $(find src -name "*.css" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo '0')"

# File counts
echo -e "\n📁 File counts:"
echo "Components:  $(find src -name "*.tsx" | wc -l)"
echo "Hooks:       $(find src -name "use*.ts" -o -name "use*.tsx" | wc -l)"
echo "Tests:       $(find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | wc -l)"

# Largest components
echo -e "\n📏 Largest components (by lines):"
find src -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -10 || echo "No components found"

###############################################################################
# 4. RENDER PERFORMANCE CHECKS
###############################################################################

echo -e "\n${BLUE}[4/5] Render Performance Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for common performance anti-patterns
echo "🔍 Scanning for performance anti-patterns..."

# Inline object/array props
INLINE_OBJECTS=$(grep -r "style={{" src/ --include="*.tsx" | wc -l || echo "0")
if [ "$INLINE_OBJECTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $INLINE_OBJECTS inline style objects (may cause re-renders)${NC}"
else
    echo -e "${GREEN}✅ No inline style objects${NC}"
fi

# Missing key props
MISSING_KEYS=$(grep -r "\.map(" src/ --include="*.tsx" | grep -v "key=" | wc -l || echo "0")
if [ "$MISSING_KEYS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Potential missing keys in $MISSING_KEYS map operations${NC}"
else
    echo -e "${GREEN}✅ Keys appear to be used in map operations${NC}"
fi

# Check for useMemo/useCallback usage
MEMO_COUNT=$(grep -r "useMemo\|useCallback" src/ --include="*.tsx" --include="*.ts" | wc -l || echo "0")
echo "📊 Memoization hooks usage: $MEMO_COUNT instances"

# Check for React.memo usage
REACT_MEMO=$(grep -r "React.memo\|memo(" src/ --include="*.tsx" | wc -l || echo "0")
echo "📊 React.memo usage: $REACT_MEMO components"

###############################################################################
# 5. LIGHTHOUSE CI (if available)
###############################################################################

echo -e "\n${BLUE}[5/5] Lighthouse Performance${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v lhci &> /dev/null; then
    echo "Running Lighthouse CI..."
    lhci autorun || echo -e "${YELLOW}⚠️  Lighthouse CI not configured${NC}"
else
    echo -e "${YELLOW}⚠️  Lighthouse CI not installed${NC}"
    echo "Install with: npm install -g @lhci/cli"
fi

###############################################################################
# RECOMMENDATIONS
###############################################################################

echo -e "\n${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   OPTIMIZATION TIPS                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo "💡 General recommendations:"
echo ""
echo "1. Code Splitting:"
echo "   - Use React.lazy() for route-based splitting"
echo "   - Lazy load heavy components"
echo ""
echo "2. Bundle Optimization:"
echo "   - Remove unused dependencies"
echo "   - Use tree-shaking (enabled by default in Vite)"
echo "   - Optimize images (WebP, AVIF formats)"
echo ""
echo "3. Render Optimization:"
echo "   - Use React.memo for expensive components"
echo "   - Implement useMemo/useCallback for heavy computations"
echo "   - Virtualize long lists (react-window, @tanstack/react-virtual)"
echo ""
echo "4. Data Fetching:"
echo "   - Use React Query for caching"
echo "   - Implement optimistic updates"
echo "   - Prefetch critical data"
echo ""
echo "5. Build Optimization:"
echo "   - Enable gzip/brotli compression"
echo "   - Set up CDN for static assets"
echo "   - Implement service workers for caching"
echo ""

echo -e "${GREEN}✅ Performance profiling complete!${NC}\n"
