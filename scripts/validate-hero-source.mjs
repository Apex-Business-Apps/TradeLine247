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

  // Results
  console.log('═══════════════════════════════════════\n');

  if (errors.length > 0) {
    console.log('❌ ❌ ❌ VALIDATION FAILED ❌ ❌ ❌\n');
    console.log('ERRORS:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
    console.log();
    console.log('🚨 DO NOT DEPLOY - Hero component has critical issues!');
    console.log('📋 Review: docs/HERO_BACKGROUND_TESTING_CHECKLIST.md\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log();
    console.log('✅ Validation passed with warnings (non-blocking)\n');
    process.exit(0);
  }

  console.log('✅ ✅ ✅ ALL VALIDATIONS PASSED ✅ ✅ ✅\n');
  console.log('HeroRoiDuo.tsx is properly structured with:');
  console.log('  • Complete file (no truncation)');
  console.log('  • Background image implementation');
  console.log('  • Required visual elements (gradient overlay, vignette)');
  console.log('  • All structural elements intact\n');
  process.exit(0);
}

// Run validation
validateHeroSource();
