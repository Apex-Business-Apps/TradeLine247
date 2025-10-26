#!/usr/bin/env node
/**
 * verify_icons.mjs — Node-only icon verifier (no external tools, no npm deps).
 * - Verifies presence + dimensions
 * - Warns if AppStore1024.png has an alpha channel (Apple prefers no transparency)
 * - Warns on very large files
 *
 * Idempotent. Windows/Android Studio/GitHub Desktop friendly.
 */

import fs from "fs";
import path from "path";
import url from "url";
import process from "process";

// ---------- config ----------
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const ICON_DIR = path.join(repoRoot, "public", "assets", "brand", "App_Icons", "ios");

// filename -> [w, h]
const EXPECTED = {
  "AppStore1024.png": [1024, 1024],
  "iPadApp152.png": [152, 152],
  "iPadApp167.png": [167, 167],
};

// Set to true to hard-fail when AppStore1024.png has alpha
const FAIL_ON_APPSTORE_ALPHA = false;

const MAX_BYTES = 300 * 1024; // warn threshold
// ---------------------------

function readPngHeader(filePath) {
  // Need 29 bytes to read: sig(8) + len(4) + type(4) + width(4) + height(4) + bitDepth(1) + colorType(1) + ...
  const fd = fs.openSync(filePath, "r");
  try {
    const header = Buffer.alloc(29);
    const n = fs.readSync(fd, header, 0, 29, 0);
    if (n < 29) throw new Error("File too small to be a PNG");

    const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!header.slice(0, 8).equals(PNG_SIG)) throw new Error("Not a PNG");

    const chunkType = header.slice(12, 16).toString("ascii");
    if (chunkType !== "IHDR") throw new Error("IHDR not at expected position");

    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    const bitDepth = header.readUInt8(24);
    const colorType = header.readUInt8(25); // 0=gray,2=truecolor,3=indexed,4=gray+alpha,6=truecolor+alpha
    const hasAlpha = colorType === 4 || colorType === 6;

    return { width, height, bitDepth, colorType, hasAlpha };
  } finally {
    fs.closeSync(fd);
  }
}

function pad(str, n) {
  return (str + " ".repeat(n)).slice(0, n);
}

let failures = 0;
const lines = [];

if (!fs.existsSync(ICON_DIR)) {
  console.error(`❌ Icon directory not found: ${ICON_DIR}`);
  process.exit(2);
}

for (const [name, [wantW, wantH]] of Object.entries(EXPECTED)) {
  const fp = path.join(ICON_DIR, name);
  if (!fs.existsSync(fp)) {
    failures++;
    lines.push(`❌ Missing: ${name} (${wantW}x${wantH})`);
    continue;
  }
  try {
    const meta = readPngHeader(fp);
    const okSize = meta.width === wantW && meta.height === wantH;
    if (!okSize) {
      failures++;
      lines.push(`❌ Size mismatch: ${pad(name, 20)} found ${meta.width}x${meta.height}, expected ${wantW}x${wantH}`);
    } else {
      lines.push(`✅ ${pad(name, 20)} ${meta.width}x${meta.height}`);
    }

    if (name === "AppStore1024.png" && meta.hasAlpha) {
      const msg = `⚠️  AppStore1024.png has an alpha channel (colorType ${meta.colorType}). Apple expects a non-transparent App Store icon.`;
      if (FAIL_ON_APPSTORE_ALPHA) {
        failures++;
        lines.push(`❌ ${msg}`);
      } else {
        lines.push(msg);
      }
    }
  } catch (e) {
    failures++;
    lines.push(`❌ Invalid PNG: ${name} (${e.message})`);
  }
}

// warn for large files
for (const f of fs.readdirSync(ICON_DIR).filter(f => f.toLowerCase().endsWith(".png"))) {
  const fp = path.join(ICON_DIR, f);
  try {
    const { size } = fs.statSync(fp);
    if (size > MAX_BYTES) lines.push(`⚠️  Large icon: ${f} ~ ${(size / 1024).toFixed(0)} kB (consider optimizing)`);
  } catch { /* ignore */ }
}

for (const ln of lines) console.log(ln);

if (failures > 0) {
  console.error(`\n❌ VERIFY: FAIL — ${failures} issue(s) found.`);
  process.exit(1);
} else {
  console.log(`\n✅ VERIFY: PASS — Icon set verified (node-only).`);
  process.exit(0);
}
