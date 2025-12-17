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
// Landing styles are in index.css, not a separate landing.css
const INDEX_CSS_PATH = path.join(__dirname, '..', 'src', 'index.css');

// HeroRoiDuo imports (background is now handled in Index.tsx)
const REQUIRED_IMPORTS = [
  'import React from "react"',
  'import officialLogo from',
  'import { LeadCaptureCard }',
  'import RoiCalculator from',
  // Allow flexible import paths for backgroundImage and officialLogo
];

// HeroRoiDuo structure elements (background moved to Index.tsx)
const REQUIRED_STRUCTURE = [
  'hero-gradient-overlay',
  'hero-vignette',
];

// HeroRoiDuo visual elements
const REQUIRED_ELEMENTS = [
  'hero-section',
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

  // 6. Background image is now handled in Index.tsx via .landing-wallpaper
  // HeroRoiDuo only needs hero-bg div for test compatibility
  const hasHeroBgDiv = content.includes('hero-bg');
  if (!hasHeroBgDiv) {
    warnings.push('Missing hero-bg div (used for test compatibility)');
  } else {
    console.log('✅ hero-bg div found (for test compatibility)\n');
  }

  // 7. Check for data-testid (used by E2E tests)
  const hasTestId = content.includes('data-testid="hero-bg"');
  if (!hasTestId) {
    warnings.push('Missing data-testid="hero-bg" attribute (used by E2E tests)');
  } else {
    console.log('✅ data-testid="hero-bg" found\n');
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

  // 5. Check index.css has hero-related styles (landing-wallpaper styled via Tailwind in Index.tsx)
  if (fs.existsSync(INDEX_CSS_PATH)) {
    const indexCss = fs.readFileSync(INDEX_CSS_PATH, 'utf-8');

    // Note: .landing-wallpaper element uses Tailwind classes (fixed inset-0 bg-cover)
    // The CSS file should have landing-shell and hero overlay styles
    if (indexCss.includes('.landing-shell') || indexCss.includes('landing-shell')) {
      console.log('✅ .landing-shell styles found in index.css');
    } else {
      warnings.push('.landing-shell styles not found in index.css');
    }

    // Check for landing-shell responsive media queries
    if (indexCss.includes('@media') && indexCss.includes('landing-shell')) {
      console.log('✅ Responsive landing-shell media queries found');
    } else {
      warnings.push('Landing-shell responsive media queries not found');
    }

    // Check for hero overlay styles
    if (indexCss.includes('.hero-gradient-overlay')) {
      console.log('✅ Hero gradient overlay styles found');
    } else {
      warnings.push('Hero gradient overlay styles not found in index.css');
    }
  } else {
    errors.push(`index.css not found at ${INDEX_CSS_PATH}`);
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
