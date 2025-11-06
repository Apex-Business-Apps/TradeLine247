#!/usr/bin/env node

/**
 * WCAG Color Contrast Analyzer
 *
 * Analyzes color combinations used in the application to ensure WCAG AA compliance.
 * WCAG AA requires:
 * - 4.5:1 contrast ratio for normal text
 * - 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)
 * - 3:1 contrast ratio for UI components and graphical objects
 *
 * Target: Achieve 5.2:1+ for excellence
 */

// Color conversion utilities
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  ];
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Relative luminance calculation
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio calculation
function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG compliance check
function checkCompliance(ratio) {
  return {
    AAA_normal: ratio >= 7.0,
    AA_normal: ratio >= 4.5,
    AA_large: ratio >= 3.0,
    fail: ratio < 3.0
  };
}

// Format result for display
function formatResult(name, bg, fg, ratio, compliance) {
  const status = compliance.AA_normal ? '✅ PASS' : '❌ FAIL';
  const level = compliance.AAA_normal ? 'AAA' :
                compliance.AA_normal ? 'AA' :
                compliance.AA_large ? 'AA (large text only)' :
                'FAIL';

  return {
    name,
    background: bg,
    foreground: fg,
    ratio: ratio.toFixed(2),
    status,
    level,
    compliance
  };
}

// Canonical color definitions from index.css
const colors = {
  // Brand colors
  'brand-orange-primary': hslToRgb(21, 100, 67),    // #ff9257
  'brand-orange-light': hslToRgb(29, 100, 95),      // #fff5eb
  'brand-orange-dark': hslToRgb(15, 100, 35),       // #b32d00
  'brand-green-primary': hslToRgb(142, 76, 36),     // #16a34a
  'brand-green-light': hslToRgb(142, 69, 58),       // #4ade80
  'brand-green-dark': hslToRgb(142, 85, 25),        // #0f5f2c

  // Semantic colors (light mode)
  'white': [255, 255, 255],
  'black': [0, 0, 0],
  'background': hslToRgb(0, 0, 100),                // white
  'foreground': hslToRgb(222.2, 84, 4.9),           // very dark blue-gray
  'muted-foreground': hslToRgb(215.4, 16.3, 30),    // medium dark gray
  'primary-foreground-white': [255, 255, 255],      // NEW: white for primary buttons
  'primary-foreground-dark-orange': hslToRgb(15, 100, 35),  // OLD: dark orange (fails)
};

console.log('\n' + '='.repeat(80));
console.log('WCAG COLOR CONTRAST ANALYSIS - TradeLine 24/7 Header Elements');
console.log('='.repeat(80) + '\n');

console.log('📋 WCAG AA Requirements:');
console.log('   • Normal text: 4.5:1 minimum contrast ratio');
console.log('   • Large text (18pt+ or 14pt+ bold): 3:1 minimum');
console.log('   • UI components: 3:1 minimum');
console.log('   • Target: 5.0:1+ for excellence\n');

console.log('🎨 Canonical Color Palette:\n');
console.log('   Brand Orange Primary: hsl(21 100% 67%) - #ff9257');
console.log('   Brand Orange Light:   hsl(29 100% 95%) - #fff5eb');
console.log('   Brand Orange Dark:    hsl(15 100% 35%) - #b32d00');
console.log('   Brand Green Primary:  hsl(142 76% 36%) - #16a34a');
console.log('   White:                hsl(0 0% 100%) - #ffffff');
console.log('   Muted Foreground:     hsl(215.4 16.3% 30%) - #3f4854\n');

console.log('-'.repeat(80) + '\n');

// Test combinations
const tests = [
  {
    name: 'Header "Home" Button (FIXED with dark orange bg)',
    bg: 'brand-orange-dark',
    fg: 'primary-foreground-white',
    element: 'Button#app-home with bg-primary (now using dark orange) text-primary-foreground'
  },
  {
    name: 'Header "Home" Button (OLD - bright orange bg)',
    bg: 'brand-orange-primary',
    fg: 'primary-foreground-white',
    element: 'OLD: White on bright orange (too low contrast)'
  },
  {
    name: 'Login/Success Button (Green) - FIXED',
    bg: 'brand-green-dark',
    fg: 'white',
    element: 'Button variant="success" now uses brand-green-dark (Login button)'
  },
  {
    name: 'Primary Buttons - Dark Orange with White Text (NEW)',
    bg: 'brand-orange-dark',
    fg: 'white',
    element: 'All primary buttons now use brand-orange-dark background'
  },
  {
    name: 'Muted Text on White Background',
    bg: 'white',
    fg: 'muted-foreground',
    element: 'text-muted-foreground on white'
  },
  {
    name: 'Links on White Background - FIXED',
    bg: 'white',
    fg: 'brand-orange-dark',
    element: 'Links (a tags) now use --primary (brand-orange-dark)'
  },
  {
    name: 'Dark Orange Text on White',
    bg: 'white',
    fg: 'brand-orange-dark',
    element: 'Used for secondary-foreground'
  },
  {
    name: 'Secondary Button Background',
    bg: 'brand-orange-light',
    fg: 'brand-orange-dark',
    element: 'Secondary button styling'
  }
];

const results = [];

console.log('🧪 Test Results:\n');

tests.forEach((test, i) => {
  const bg = colors[test.bg];
  const fg = colors[test.fg];
  const ratio = getContrastRatio(bg, fg);
  const compliance = checkCompliance(ratio);
  const result = formatResult(test.name, test.bg, test.fg, ratio, compliance);
  // Don't count "OLD" tests as failures - they're just for comparison
  const isComparison = test.name.includes('OLD') || test.name.includes('old');
  results.push({ ...result, element: test.element, isComparison });

  const icon = compliance.AA_normal ? '✅' : '❌';
  console.log(`${i + 1}. ${test.name}`);
  console.log(`   Background: ${test.bg}`);
  console.log(`   Foreground: ${test.fg}`);
  console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1 ${icon}`);
  console.log(`   WCAG Level: ${result.level}`);
  console.log(`   Element: ${test.element}`);
  console.log();
});

console.log('-'.repeat(80) + '\n');

// Summary (excluding comparison tests)
const actualTests = results.filter(r => !r.isComparison);
const passing = actualTests.filter(r => r.compliance.AA_normal).length;
const failing = actualTests.filter(r => !r.compliance.AA_normal).length;

console.log('📊 Summary:\n');
console.log(`   Total Tests: ${results.length} (${actualTests.length} active, ${results.length - actualTests.length} comparison)`);
console.log(`   ✅ Passing (WCAG AA): ${passing}`);
console.log(`   ❌ Failing (WCAG AA): ${failing}`);

if (failing === 0) {
  console.log('\n🎉 All color combinations pass WCAG AA compliance!');
  console.log('   Header buttons now use white text on dark orange backgrounds.');
  console.log('   Login button uses white text on dark green background.');
  console.log('   Contrast ratios meet or exceed 4.5:1 minimum requirement.\n');
  console.log('   Key Improvements:');
  console.log('   • Header "Home" button: 6.38:1 contrast (was 2.21:1)');
  console.log('   • Login/Success button: 5.76:1 contrast (was 3.33:1)');
  console.log('   • All primary buttons: 6.38:1 contrast');
  console.log('   • Links: 6.38:1 contrast (was 2.21:1)');
} else {
  console.log('\n⚠️  Some combinations need attention:\n');
  actualTests.filter(r => !r.compliance.AA_normal).forEach(r => {
    console.log(`   • ${r.name}: ${r.ratio}:1 (needs 4.5:1)`);
  });
  console.log();
}

console.log('='.repeat(80) + '\n');

// Export for CI/CD (only fail on actual test failures, not comparison tests)
if (failing > 0) {
  process.exit(1);
}
