#!/bin/bash
# Add aria-hidden to decorative icons for accessibility

set -e

echo "♿ Adding aria-hidden to decorative icons..."

# Function to add aria-hidden to icon components
fix_icons() {
  local file="$1"
  echo "  Processing: $file"

  # Add aria-hidden to CheckCircle icons without it
  sed -i 's/<CheckCircle className="\([^"]*\)" \/>/<CheckCircle className="\1" aria-hidden="true" \/>/g' "$file"
  sed -i 's/<CheckCircle className="\([^"]*\)"$/<CheckCircle className="\1" aria-hidden="true"/g' "$file"

  # Add aria-hidden to CheckCircle2
  sed -i 's/<CheckCircle2 className="\([^"]*\)" \/>/<CheckCircle2 className="\1" aria-hidden="true" \/>/g' "$file"

  # Add aria-hidden to XCircle
  sed -i 's/<XCircle className="\([^"]*\)" \/>/<XCircle className="\1" aria-hidden="true" \/>/g' "$file"

  # Add aria-hidden to AlertTriangle
  sed -i 's/<AlertTriangle className="\([^"]*\)" \/>/<AlertTriangle className="\1" aria-hidden="true" \/>/g' "$file"

  # Add aria-hidden to AlertCircle
  sed -i 's/<AlertCircle className="\([^"]*\)" \/>/<AlertCircle className="\1" aria-hidden="true" \/>/g' "$file"
}

# Process key files
for file in src/pages/{Features,Pricing,Demo,Security}.tsx; do
  if [ -f "$file" ]; then
    fix_icons "$file"
  fi
done

echo "✅ Aria-hidden attributes added!"
