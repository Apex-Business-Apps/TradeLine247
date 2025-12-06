#!/usr/bin/env node
// Build asset verification with strictness toggle
// PRs: STRICT_ASSETS=false -> warnings for optional items
// Release: STRICT_ASSETS=true -> fail if optional items missing/empty

const fs = require('fs');
const path = require('path');

const DIST = 'dist';
const STRICT = process.env.STRICT_ASSETS === 'true';

function existsNonEmpty(p) {
  try {
    const s = fs.statSync(p);
    return s.isFile() && s.size > 0;
  } catch { return false; }
}

function info(msg) { console.log(`✅ [verify-build] ${msg}`); }
function warn(msg) { console.warn(`⚠️  [verify-build] ${msg}`); }
function fail(msg) { console.error(`❌ [verify-build] ${msg}`); process.exitCode = 1; }

console.log('✅ [verify-build] Starting build verification...');

const indexHtml = path.join(DIST, 'index.html');
if (!existsNonEmpty(indexHtml)) {
  console.error('❌ [verify-build] dist/index.html missing or empty');
  process.exit(1);
}
info('index.html exists');

// Adjust these if your bundler output names differ:
const assetsDir = path.join(DIST, 'assets');
let hashedCss;
let hashedJs;

try {
  const entries = fs.readdirSync(assetsDir);
  const cssFiles = entries.filter(f => /^index-\w+\.css$/.test(f));
  const jsFiles = entries.filter(f => /^index-\w+\.js$/.test(f));

  hashedCss = cssFiles.map(f => path.join(assetsDir, f));
  hashedJs = jsFiles.map(f => path.join(assetsDir, f));

  if (hashedCss.length === 0) {
    const fallback = path.join(assetsDir, 'index.css');
    if (existsNonEmpty(fallback)) {
      info('Main CSS bundle detected: index.css');
    } else {
      const msg = 'Main CSS bundle (index-*.css) missing or empty';
      STRICT ? fail(msg) : warn(msg);
    }
  } else {
    const healthyCss = hashedCss.find(cssPath => existsNonEmpty(cssPath));
    if (healthyCss) {
      info(`Main CSS bundle detected: ${path.basename(healthyCss)}`);
    } else {
      const msg = 'Main CSS bundle detected but empty (index-*.css)';
      STRICT ? fail(msg) : warn(msg);
    }
  }

  if (hashedJs.length === 0) {
    const fallback = path.join(assetsDir, 'index.js');
    if (existsNonEmpty(fallback)) {
      info('Main JS bundle detected: index.js');
    } else {
      const msg = 'Main JS bundle (index-*.js) missing or empty';
      STRICT ? fail(msg) : warn(msg);
    }
  } else {
    const healthyJs = hashedJs.find(jsPath => existsNonEmpty(jsPath));
    if (healthyJs) {
      info(`Main JS bundle detected: ${path.basename(healthyJs)}`);
    } else {
      const msg = 'Main JS bundle detected but empty (index-*.js)';
      STRICT ? fail(msg) : warn(msg);
    }
  }
} catch (error) {
  const msg = `Failed to inspect assets directory: ${error instanceof Error ? error.message : String(error)}`;
  STRICT ? fail(msg) : warn(msg);
}

const font = path.join(DIST, 'assets', 'fonts', 'BrandFont.woff2');
if (!existsNonEmpty(font)) {
  const msg = 'BrandFont.woff2 missing or empty';
  STRICT ? fail(msg) : warn(msg);
} else {
  info('BrandFont.woff2 present and non-empty');
}

const manifest = path.join(DIST, 'manifest.webmanifest');
if (!existsNonEmpty(manifest)) {
  const msg = 'manifest.webmanifest missing or empty';
  STRICT ? fail(msg) : warn(msg);
} else {
  info('manifest.webmanifest exists');
}

console.log('\n============================================================');
if (process.exitCode === 1) {
  console.log('❌ [verify-build] Build verification FAILED');
  process.exit(1);
}
console.log('✅ [verify-build] Build verification PASSED');
