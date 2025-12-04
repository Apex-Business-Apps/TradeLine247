#!/bin/bash

echo "🎯 Hero Component Discovery"
echo "==========================="

# Create recon report
mkdir -p .recon
REPORT=".recon/hero-audit-$(date +%Y%m%d-%H%M%S).txt"

echo "RECONNAISSANCE REPORT - $(date)" > $REPORT
echo "================================" >> $REPORT

# Find all hero-related files
echo "" >> $REPORT
echo "📁 HERO COMPONENTS:" >> $REPORT
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "hero\|Hero\|pricing\|compare\|features\|faq\|contact" {} \; | while read file; do
    echo "  - $file" >> $REPORT

    # Extract hero selectors
    grep -n "className.*hero\|data-testid.*hero\|from-orange" "$file" >> $REPORT 2>/dev/null
done

# Find CSS files
echo "" >> $REPORT
echo "🎨 CSS FILES:" >> $REPORT
find src -name "*.css" -type f | while read css; do
    echo "  - $css" >> $REPORT

    # Extract hero styles
    grep -n "hero\|gradient.*orange" "$css" >> $REPORT 2>/dev/null
done

# Analyze test expectations
echo "" >> $REPORT
echo "🧪 TEST EXPECTATIONS:" >> $REPORT
grep -r "hero" tests/ --include="*.ts" -n >> $REPORT 2>/dev/null

# Find current color usage
echo "" >> $REPORT
echo "🎨 CURRENT BRAND COLOR USAGE:" >> $REPORT
grep -r "#e55a2b\|e55a2b\|orange-6" src --include="*.tsx" --include="*.css" -n | head -20 >> $REPORT

# Generate selector recommendations
echo "" >> $REPORT
echo "💡 RECOMMENDED CSS SELECTORS:" >> $REPORT
echo "Based on analysis, use these selectors:" >> $REPORT

# Smart selector detection
if grep -q "hero-gradient" src/**/*.tsx 2>/dev/null; then
    echo "  ✓ .hero-gradient (detected in components)" >> $REPORT
fi
if grep -q "data-testid=\"hero-bg\"" src/**/*.tsx 2>/dev/null; then
    echo "  ✓ [data-testid=\"hero-bg\"] (detected in tests)" >> $REPORT
fi
if grep -q "from-orange" src/**/*.tsx 2>/dev/null; then
    echo "  ✓ [class*=\"from-orange\"] (detected Tailwind utility)" >> $REPORT
fi

# Display report
cat $REPORT
echo ""
echo "📊 Report saved: $REPORT"
echo ""
echo "✅ Next: Review selectors above, then proceed to Phase 2"
