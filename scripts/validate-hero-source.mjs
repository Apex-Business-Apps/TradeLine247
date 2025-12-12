#!/usr/bin/env node
/**
 * Build-Time Hero Component Validation
 *
 * This script validates the HeroRoiDuo.tsx source file to prevent regressions.
 * Run during build to ensure critical CSS classes and structure are intact.
 *
 * Checks:
 * 1. File completeness (not truncated)
 * 2. Required responsive CSS classes
 * 3. Required imports
 * 4. Component structure integrity
 * 5. Wallpaper constants presence
 *
 * Usage: node scripts/validate-hero-source.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HERO_FILE_PATH = path.join(__dirname, '..', 'src', 'sections', 'HeroRoiDuo.tsx');

const REQUIRED_CSS_CLASSES = [
  'min-h-screen',
  'bg-contain',
  'bg-top',
  'bg-no-repeat',
  'bg-scroll',
  'md:bg-cover',
];

const REQUIRED_IMPORTS = [
  'import React from "react"',
  'import backgroundImage from',
  'import officialLogo from',
  'import { LeadCaptureCard }',
  'import RoiCalculator from',
];

const REQUIRED_STRUCTURE = [
  'HERO_RESPONSIVE_CLASSES',
  'HERO_INLINE_STYLES',
  'data-wallpaper-version',
  'hero-gradient-overlay',
  'hero-vignette',
  'data-node="grid"',
  'data-node="ron"',
  'data-node="start"',
];

const MIN_FILE_LENGTH = 130; // Minimum lines - truncation protection
const EXPECTED_CLOSING = 'export default function HeroRoiDuo';

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
  if (!lastNonEmptyLine || lastNonEmptyLine.trim() !== '}') {
    warnings.push('File may not end properly. Last non-empty line: ' + lastNonEmptyLine);
  }

  // 3. Check for incomplete sentences (truncation indicator)
  const incompleteSentences = content.match(/\b(sle|wor|cal|hel|you|the|and|whi)\s*$/m);
  if (incompleteSentences) {
    errors.push('File contains incomplete word at end - likely truncated!');
  }

  // 4. Validate required imports
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

  // 5. Validate required CSS classes
  console.log('🎨 Checking Required CSS Classes:');
  REQUIRED_CSS_CLASSES.forEach(className => {
    if (content.includes(className)) {
      console.log(`  ✅ ${className}`);
    } else {
      errors.push(`Missing required CSS class: ${className}`);
      console.log(`  ❌ ${className}`);
    }
  });
  console.log();

  // 6. Validate required structure elements
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

  // 7. Check responsive wallpaper constants
  if (!content.includes('HERO_RESPONSIVE_CLASSES')) {
    errors.push('Missing HERO_RESPONSIVE_CLASSES constants');
  }
  if (!content.includes('HERO_INLINE_STYLES')) {
    errors.push('Missing HERO_INLINE_STYLES constants');
  }

  // 8. Validate backgroundAttachment: 'scroll'
  if (!content.includes("backgroundAttachment: 'scroll'")) {
    errors.push("Missing backgroundAttachment: 'scroll' (critical for mobile)");
  } else {
    console.log("✅ backgroundAttachment: 'scroll' present\n");
  }

  // 9. Check for wallpaper version tag
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

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ ✅ ✅ ALL VALIDATIONS PASSED ✅ ✅ ✅\n');
    console.log('HeroRoiDuo.tsx is properly structured with:');
    console.log('  • Complete file (no truncation)');
    console.log('  • All required responsive CSS classes');
    console.log('  • Proper wallpaper constants');
    console.log('  • All structural elements intact\n');
    return true;
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ ❌ ❌ VALIDATION FAILED ❌ ❌ ❌\n');
    console.log('ERRORS:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
    console.log();
    console.log('🚨 DO NOT DEPLOY - Hero component has critical issues!');
    console.log('📋 Review: docs/HERO_BACKGROUND_TESTING_CHECKLIST.md\n');
    process.exit(1);
  }

  return warnings.length === 0;
}

// Run validation
validateHeroSource();
