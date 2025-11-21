#!/usr/bin/env bash
# ==============================================================================
# Xcode Project Signing Configuration Fix
# ==============================================================================
# Ensures automatic code signing is enabled in the Xcode project file itself,
# not just via command-line flags. This prevents Status Code 65 errors.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROJECT_PATH="ios/App/App.xcodeproj/project.pbxproj"

if [[ ! -f "$PROJECT_PATH" ]]; then
  echo "❌ ERROR: Xcode project not found at $PROJECT_PATH" >&2
  exit 1
fi

echo "[fix-xcode-signing] Configuring automatic code signing in Xcode project"

# Backup original project file
cp "$PROJECT_PATH" "${PROJECT_PATH}.backup"

# Use PlistBuddy or direct sed to set signing configuration
# This ensures ProvisioningStyle = Automatic for all targets

if command -v python3 >/dev/null; then
  python3 << 'EOF'
import re
import sys

project_path = 'ios/App/App.xcodeproj/project.pbxproj'

with open(project_path, 'r') as f:
    content = f.read()

# Patterns to fix
replacements = [
    # Set ProvisioningStyle to Automatic
    (r'ProvisioningStyle = Manual;', 'ProvisioningStyle = Automatic;'),
    
    # Remove hardcoded DEVELOPMENT_TEAM if conflicting
    # (we'll set it via xcodebuild flags)
    # (r'DEVELOPMENT_TEAM = [^;]+;', 'DEVELOPMENT_TEAM = "";'),
    
    # Remove hardcoded CODE_SIGN_IDENTITY
    (r'CODE_SIGN_IDENTITY = "[^"]+";', 'CODE_SIGN_IDENTITY = "iPhone Distribution";'),
    
    # Remove hardcoded provisioning profile specifiers
    (r'PROVISIONING_PROFILE_SPECIFIER = "[^"]*";', 'PROVISIONING_PROFILE_SPECIFIER = "";'),
]

modified = content
for pattern, replacement in replacements:
    modified = re.sub(pattern, replacement, modified)

with open(project_path, 'w') as f:
    f.write(modified)

print("✅ Xcode project signing configuration updated")
EOF
else
  # Fallback to sed if Python not available
  sed -i.bak \
    -e 's/ProvisioningStyle = Manual;/ProvisioningStyle = Automatic;/g' \
    -e 's/CODE_SIGN_IDENTITY = "[^"]*";/CODE_SIGN_IDENTITY = "iPhone Distribution";/g' \
    -e 's/PROVISIONING_PROFILE_SPECIFIER = "[^"]*";/PROVISIONING_PROFILE_SPECIFIER = "";/g' \
    "$PROJECT_PATH"
  
  echo "✅ Xcode project signing configuration updated (via sed)"
fi

echo "[fix-xcode-signing] Verifying changes"
if grep -q "ProvisioningStyle = Automatic" "$PROJECT_PATH"; then
  echo "  ✓ ProvisioningStyle = Automatic"
else
  echo "  ⚠ Could not verify ProvisioningStyle setting"
fi

echo "[fix-xcode-signing] Done. Original backed up to ${PROJECT_PATH}.backup"

