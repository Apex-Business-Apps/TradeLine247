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
];

const REQUIRED_STRUCTURE = [
  'hero-gradient-overlay',
  'hero-vignette',
  'BACKGROUND_IMAGE1',
];

const REQUIRED_ELEMENTS = [
  'hero-section',
  'absolute inset-0',
  'backgroundImage',
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

  // 6. Check for background image implementation (current uses inline styles)
  const hasBackgroundImage = content.includes('backgroundImage') && 
                             (content.includes('url(${backgroundImage})') || content.includes('url('));
  if (!hasBackgroundImage) {
    errors.push('Missing background image implementation');
  } else {
    console.log('✅ Background image implementation found\n');
  }

  // 7. Check for background styling (size, position, repeat)
  const hasBackgroundSize = content.includes('backgroundSize') || content.includes('background-size');
  const hasBackgroundPosition = content.includes('backgroundPosition') || content.includes('background-position');
  const hasBackgroundRepeat = content.includes('backgroundRepeat') || content.includes('background-repeat');
  
  if (!hasBackgroundSize) {
    errors.push('Missing background size styling');
  } else {
    console.log('✅ Background size styling found');
  }
  if (!hasBackgroundPosition) {
    errors.push('Missing background position styling');
  } else {
    console.log('✅ Background position styling found');
  }
  if (!hasBackgroundRepeat) {
    errors.push('Missing background repeat styling');
  } else {
    console.log('✅ Background repeat styling found\n');
  }

  // 8. Verify background image div structure
  const hasBackgroundDiv = content.includes('absolute inset-0') && content.includes('backgroundImage');
  if (!hasBackgroundDiv) {
    errors.push('Missing background image div with absolute positioning');
  } else {
    console.log('✅ Background image div structure correct\n');
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

  // 3. CRITICAL: Check backgroundPosition is NOT hardcoded in inline style (CSS handles responsive focal points)
  // Mobile must be 20%, tablet 15%, desktop center - handled by CSS media queries
  if (indexContent.includes('backgroundPosition:') && indexContent.includes('"center"')) {
    // Check if it's in createWallpaperStyle - if so, it should be commented out
    const styleFunctionMatch = indexContent.match(/createWallpaperStyle[\s\S]*?backgroundPosition[^}]*}/);
    if (styleFunctionMatch && !styleFunctionMatch[0].includes('removed') && !styleFunctionMatch[0].includes('CSS handles')) {
      errors.push('CRITICAL: backgroundPosition is hardcoded in inline style. CSS media queries must handle responsive focal points (20% mobile, 15% tablet, center desktop).');
    } else {
      console.log('✅ backgroundPosition correctly delegated to CSS (responsive focal points)');
    }
  } else {
    console.log('✅ backgroundPosition not hardcoded (CSS handles it)');
  }

  // 4. Check CSS variable is set
  if (!indexContent.includes('--landing-wallpaper')) {
    warnings.push('--landing-wallpaper CSS variable not found in Index.tsx');
  } else {
    console.log('✅ --landing-wallpaper CSS variable is set');
  }

  // 5. Check landing.css has responsive media queries
  if (fs.existsSync(LANDING_CSS_PATH)) {
    const landingCss = fs.readFileSync(LANDING_CSS_PATH, 'utf-8');
    
    if (!landingCss.includes('@media (max-width: 768px)') || !landingCss.includes('20%')) {
      errors.push('Missing mobile media query with 20% focal point in landing.css');
    } else {
      console.log('✅ Mobile media query (20% focal point) found');
    }

    if (!landingCss.includes('@media (max-width: 1024px)') || !landingCss.includes('15%')) {
      errors.push('Missing tablet media query with 15% focal point in landing.css');
    } else {
      console.log('✅ Tablet media query (15% focal point) found');
    }

    if (!landingCss.includes('center') && !landingCss.includes('background-position: center')) {
      warnings.push('Desktop background-position (center) not explicitly found in landing.css');
    } else {
      console.log('✅ Desktop background-position (center) found');
    }
  } else {
    errors.push(`landing.css not found at ${LANDING_CSS_PATH}`);
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
