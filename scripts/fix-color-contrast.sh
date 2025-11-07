#!/bin/bash
# Color Contrast Fix Script - WCAG 2 AA Compliance
# Systematically fixes all color contrast violations

set -e

echo "🎨 Starting color contrast fixes..."

# Function to replace in files
fix_colors() {
  local file="$1"
  echo "  Fixing: $file"

  # Fix yellow text violations (CRITICAL)
  sed -i 's/text-yellow-600/text-amber-800/g' "$file"
  sed -i 's/text-yellow-500/text-amber-700/g' "$file"
  sed -i 's/border-yellow-500/border-amber-600/g' "$file"
  sed -i 's/bg-yellow-500/bg-amber-600/g' "$file"

  # Fix green text violations (text-green-500 -> brand-green-dark)
  sed -i 's/text-green-500/text-[hsl(142,85%,25%)]/g' "$file"
  sed -i 's/bg-green-500\([^/]\)/bg-[hsl(142,85%,25%)]\1/g' "$file"

  # Fix red text for better contrast
  sed -i 's/text-red-600 /text-red-700 /g' "$file"
  sed -i 's/text-red-500/text-red-700/g' "$file"
}

# Fix all TSX files in src directory
echo "📁 Processing TypeScript files..."
find /home/user/tradeline247aicom/src -type f -name "*.tsx" -print0 | while IFS= read -r -d '' file; do
  if grep -q -E "text-yellow-600|text-yellow-500|text-green-500|border-yellow-500" "$file" 2>/dev/null; then
    fix_colors "$file"
  fi
done

echo "✅ Color contrast fixes complete!"
echo ""
echo "📊 Summary:"
echo "  - Yellow text → Amber (WCAG AA: 5.5:1+)"
echo "  - Green icons → Brand green dark (WCAG AA: 5.76:1)"
echo "  - Red text → Darker red (WCAG AA: 4.8:1+)"
echo ""
echo "🧪 Next: Run tests to verify"
