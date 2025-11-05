// Test color contrast ratios for different lightness values
// HSL 21 100% lightness% vs white (#FFFFFF)

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(l1, l2) {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function testContrast(lightness) {
  const [r, g, b] = hslToRgb(21, 100, lightness);
  const lum = getLuminance(r, g, b);
  const whiteLum = 1.0;
  const contrast = getContrast(whiteLum, lum);
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  
  console.log(`HSL(21, 100%, ${lightness}%) = RGB(${r}, ${g}, ${b}) = ${hex}`);
  console.log(`  Contrast with white: ${contrast.toFixed(2)}:1 ${contrast >= 4.5 ? '✅ PASS' : '❌ FAIL'} (needs 4.5:1 minimum)`);
  console.log('');
  
  return { lightness, contrast, hex, pass: contrast >= 4.5 };
}

console.log('Testing HSL 21 100% lightness values for WCAG AA compliance (4.5:1 minimum)\n');
console.log('=' .repeat(70));

const results = [];
for (const l of [38, 39, 40, 41, 42, 43, 44, 45]) {
  results.push(testContrast(l));
}

console.log('=' .repeat(70));
console.log('\nRecommendation:');
const passing = results.filter(r => r.pass);
const best = passing.reduce((best, curr) => curr.lightness > best.lightness ? curr : best, passing[0]);

if (best) {
  console.log(`✅ Use HSL(21, 100%, ${best.lightness}%) = ${best.hex}`);
  console.log(`   Contrast: ${best.contrast.toFixed(2)}:1 (exceeds 4.5:1 by ${(best.contrast - 4.5).toFixed(2)})`);
  console.log(`   This is the lightest shade that still meets WCAG AA while staying true to brand`);
} else {
  console.log('❌ No lightness value between 38-45% meets WCAG AA requirements');
}

