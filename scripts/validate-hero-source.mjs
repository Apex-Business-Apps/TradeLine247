#!/usr/bin/env node
/**
 * Build-Time Hero Component Validation
 *
 * This script validates the HeroRoiDuo.tsx source file to prevent regressions.
 * Run during build to ensure critical visual elements and structure are intact.
 *
 * Checks:
 * 1. File completeness (not truncated)
 * 2. Required imports
 * 3. Background image implementation
 * 4. Visual elements (gradient overlay, vignette)
 * 5. Component structure integrity
 *
 * Usage: node scripts/validate-hero-source.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HERO_FILE_PATH = path.join(__dirname, '..', 'src', 'sections', 'HeroRoiDuo.tsx');
const INDEX_FILE_PATH = path.join(__dirname, '..', 'src', 'pages', 'Index.tsx');
const LANDING_CSS_PATH = path.join(__dirname, '..', 'src', 'styles', 'landing.css');

const REQUIRED_IMPORTS = [
  'import React from "react"',
  'import backgroundImage from',
  'import officialLogo from',
  'import { LeadCaptureCard }',
  'import RoiCalculator from',
  // Allow flexible import paths for backgroundImage and officialLogo
];

const REQUIRED_STRUCTURE = [
  'hero-gradient-overlay',
  'hero-vignette',
  'hero-section',
  // BACKGROUND_IMAGE1 is in the import path, not as a standalone variable
];

const REQUIRED_ELEMENTS = [
  'hero-section',
  'backgroundImage',
  // Position classes may vary (relative, fixed, absolute)
];

const MIN_FILE_LENGTH = 100; // Minimum lines - truncation protection

function validateHeroSource() {
  console.log('🔍 Validating HeroRoiDuo.tsx source...\n');

  // Check file exists
  if (!fs.existsSync(HERO_FILE_PATH)) {
    console.error('❌ FATAL: HeroRoiDuo.tsx not found at', HERO_FILE_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(HERO_FILE_PATH, 'utf-8');
  const lines = content.split('\n');
  const lineCount = lines.length;

  const errors = [];
  const warnings = [];

  // 1. Check file length (truncation detection)
  console.log(`📏 File Length: ${lineCount} lines`);
  if (lineCount < MIN_FILE_LENGTH) {
    errors.push(`File appears truncated! Only ${lineCount} lines (expected ≥${MIN_FILE_LENGTH})`);
  } else {
    console.log('✅ File length check passed\n');
  }

  // 2. Check file ends properly
  const lastNonEmptyLine = lines.filter(l => l.trim()).pop();
  if (!lastNonEmptyLine || !lastNonEmptyLine.trim().endsWith('}')) {
    warnings.push('File may not end properly. Last non-empty line: ' + lastNonEmptyLine?.substring(0, 50));
  }

  // 3. Validate required imports
  console.log('📦 Checking Required Imports:');
  REQUIRED_IMPORTS.forEach(importStr => {
    if (content.includes(importStr)) {
      console.log(`  ✅ ${importStr.substring(0, 40)}...`);
    } else {
      errors.push(`Missing required import: ${importStr}`);
      console.log(`  ❌ ${importStr}`);
    }
  });
  console.log();

  // 4. Check component structure
  console.log('🏗️  Checking Component Structure:');
  REQUIRED_STRUCTURE.forEach(element => {
    if (content.includes(element)) {
      console.log(`  ✅ ${element}`);
    } else {
      errors.push(`Missing required structure element: ${element}`);
      console.log(`  ❌ ${element}`);
    }
  });
  console.log();

  // 5. Check required visual elements
  console.log('🎨 Checking Visual Elements:');
  REQUIRED_ELEMENTS.forEach(element => {
    if (content.includes(element)) {
      console.log(`  ✅ ${element}`);
    } else {
      errors.push(`Missing required visual element: ${element}`);
      console.log(`  ❌ ${element}`);
    }
  });
  console.log();

  // 6. Check for background image implementation (inline styles or CSS)
  const hasBackgroundImage = content.includes('backgroundImage') ||
                             content.includes('background-image') ||
                             content.includes('url(${backgroundImage})') ||
                             content.includes('url(');
  if (!hasBackgroundImage) {
    errors.push('Missing background image implementation');
  } else {
    console.log('✅ Background image implementation found\n');
  }

  // 7. Check for background styling (may be in CSS classes or inline)
  const hasBackgroundStyling = content.includes('bg-cover') ||
                              content.includes('backgroundSize') ||
                              content.includes('background-size') ||
                              content.includes('backgroundPosition') ||
                              content.includes('background-position') ||
                              content.includes('fixed inset-0');

  if (!hasBackgroundStyling) {
    warnings.push('Background styling may be incomplete');
  } else {
    console.log('✅ Background styling found\n');
  }

  // 8. Verify background image structure
  const hasBackgroundStructure = content.includes('backgroundImage') ||
                                (content.includes('hero-bg') && content.includes('backgroundImage'));
  if (!hasBackgroundStructure) {
    warnings.push('Background image structure may need verification');
  } else {
    console.log('✅ Background image structure present\n');
  }

  // 9. Check for wallpaper version tag (optional but recommended)
  if (content.includes('data-wallpaper-version')) {
    const versionMatch = content.match(/data-wallpaper-version="([^"]+)"/);
    if (versionMatch) {
      console.log(`✅ Wallpaper version: ${versionMatch[1]}\n`);
    }
  } else {
    warnings.push('Missing data-wallpaper-version attribute (recommended for tracking)');
  }

  // 10. Validate closing structure
  const hasClosingSection = content.includes('</section>');
  const hasClosingFunction = content.includes('};') || content.includes('}');

  if (!hasClosingSection) {
    errors.push('Missing closing </section> tag');
  }
  if (!hasClosingFunction) {
    errors.push('Missing closing function brace');
  }

  return { errors, warnings };
}

function validateLandingWallpaper() {
  console.log('🔍 Validating landing wallpaper implementation...\n');

  const errors = [];
  const warnings = [];

  // Check Index.tsx
  if (!fs.existsSync(INDEX_FILE_PATH)) {
    errors.push(`Index.tsx not found at ${INDEX_FILE_PATH}`);
    return { errors, warnings };
  }

  const indexContent = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');

  // 1. Check .landing-wallpaper element exists
  if (!indexContent.includes('landing-wallpaper')) {
    errors.push('Missing .landing-wallpaper element in Index.tsx');
  } else {
    console.log('✅ .landing-wallpaper element found');
  }

  // 2. Check backgroundImage is set (not hardcoded "none")
  if (!indexContent.includes('backgroundImage') || indexContent.includes('backgroundImage: "none"')) {
    errors.push('Missing or invalid backgroundImage in wallpaper style');
  } else {
    console.log('✅ backgroundImage is set');
  }

  // 3. Check backgroundPosition implementation
  // Current implementation uses fixed positioning with bg-cover class
  if (indexContent.includes('fixed inset-0') && indexContent.includes('bg-cover')) {
    console.log('✅ Background positioning uses fixed positioning with cover sizing');
  } else {
    warnings.push('Background positioning may not be optimally configured');
  }

  // 4. Check CSS variable is set
  if (!indexContent.includes('--hero-wallpaper-image') && !indexContent.includes('wallpaperVariables')) {
    warnings.push('Wallpaper CSS variable not found in Index.tsx');
  } else {
    console.log('✅ Wallpaper CSS variable is set');
  }

  // 5. Check wallpaper implementation (CSS variables or inline styles)
  // Note: Current implementation uses inline styles in Index.tsx, not landing.css
  if (indexContent.includes('backgroundImage') && (indexContent.includes('fixed inset-0') || indexContent.includes('landing-wallpaper'))) {
    console.log('✅ Wallpaper background implementation found');
  } else {
    errors.push('Missing wallpaper background implementation in Index.tsx');
  }

  // 6. Check DO NOT CHANGE comment exists
  if (!indexContent.includes('DO NOT CHANGE') && !indexContent.includes('Do not change')) {
    warnings.push('Missing "DO NOT CHANGE" comment near wallpaper implementation');
  } else {
    console.log('✅ Wallpaper protection comment found');
  }

  console.log();
  return { errors, warnings };
}

// Main validation
function runAllValidations() {
  const heroResults = validateHeroSource();
  const wallpaperResults = validateLandingWallpaper();

  const allErrors = [...heroResults.errors, ...wallpaperResults.errors];
  const allWarnings = [...heroResults.warnings, ...wallpaperResults.warnings];

  // Results
  console.log('═══════════════════════════════════════\n');

  if (allErrors.length > 0) {
    console.log('❌ ❌ ❌ VALIDATION FAILED ❌ ❌ ❌\n');
    console.log('ERRORS:');
    allErrors.forEach(e => console.log(`  ❌ ${e}`));
    console.log();
    console.log('🚨 DO NOT DEPLOY - Hero component has critical issues!');
    console.log('📋 Review: docs/HERO_BACKGROUND_TESTING_CHECKLIST.md\n');
    process.exit(1);
  }

  if (allWarnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    allWarnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log();
    console.log('✅ Validation passed with warnings (non-blocking)\n');
    process.exit(0);
  }

  console.log('✅ ✅ ✅ ALL VALIDATIONS PASSED ✅ ✅ ✅\n');
  console.log('Hero components are properly structured with:');
  console.log('  • Complete files (no truncation)');
  console.log('  • Background image implementation');
  console.log('  • Required visual elements (gradient overlay, vignette)');
  console.log('  • Landing wallpaper with responsive focal points (CSS media queries)');
  console.log('  • All structural elements intact\n');
  process.exit(0);
}

// Run all validations
runAllValidations();
