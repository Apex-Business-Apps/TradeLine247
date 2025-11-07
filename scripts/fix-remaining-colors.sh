#!/bin/bash
set -e

echo "🎨 Fixing remaining color contrast issues..."

# Safe color replacements for WCAG AA compliance
# text-green-600 → text-[hsl(142,85%,25%)] (darker, safer)
# bg-green-500/10 text-green-600 → bg-[hsl(142,85%,95%)] text-[hsl(142,85%,25%)]

FILES=(
  "src/pages/integrations/AutomationIntegration.tsx"
  "src/pages/integrations/CRMIntegration.tsx"
  "src/pages/integrations/EmailIntegration.tsx"
  "src/pages/integrations/MessagingIntegration.tsx"
  "src/pages/integrations/MobileIntegration.tsx"
  "src/pages/integrations/PhoneIntegration.tsx"
  "src/components/dashboard/IntegrationsGrid.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing: $file"

    # Replace green badge patterns with WCAG AA compliant colors
    sed -i 's/bg-green-500\/10 text-green-600 border-green-500\/20/bg-[hsl(142,85%,95%)] text-[hsl(142,85%,25%)] border-[hsl(142,85%,70%)]/g' "$file"

    # Replace standalone text-green-600
    sed -i 's/text-green-600/text-[hsl(142,85%,25%)]/g' "$file"

    # Replace yellow gradient backgrounds (decorative)
    sed -i 's/from-yellow-500\/10 to-yellow-500\/5/from-amber-600\/10 to-amber-600\/5/g' "$file"
  fi
done

echo "✅ Color fixes applied to ${#FILES[@]} files"
echo ""
echo "Colors updated:"
echo "  • text-green-600 → text-[hsl(142,85%,25%)] (darker green, WCAG AA)"
echo "  • bg-green-500/10 → bg-[hsl(142,85%,95%)] (lighter background)"
echo "  • yellow gradients → amber gradients (better visibility)"
