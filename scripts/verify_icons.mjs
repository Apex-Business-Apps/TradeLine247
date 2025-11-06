#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Strict mode: set STRICT_ICONS=true to fail build on missing/invalid icons
// Default (non-strict): logs warnings but allows build to continue
const STRICT = process.env.STRICT_ICONS === 'true';

const mustExist = [
  "public/assets/brand/icon_master.svg",                         // master
  "public/assets/brand/App_Icons/icon-192.png",
  "public/assets/brand/App_Icons/icon-512.png",
  "public/assets/brand/App_Icons/maskable-192.png",
  "public/assets/brand/App_Icons/maskable-512.png",
  "public/assets/brand/App_Icons/ios/iPhoneApp180.png",
  "public/assets/brand/App_Icons/ios/iPhoneSpotlight120.png",
  "public/assets/brand/App_Icons/ios/iPadApp152.png",
  "public/assets/brand/App_Icons/ios/iPadApp167.png",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
];

let miss = 0;
for (const f of mustExist) {
  if (!fs.existsSync(f)) {
    const prefix = STRICT ? "ERROR" : "WARNING";
    console.log(`${prefix}: MISSING: ${f}`);
    miss = 1;
  }
}

// quick PNG dim check (requires ImageMagick identify; skip if absent)
function size(p) {
  try { return execSync(`identify -format %wx%h ${p}`).toString().trim(); }
  catch { return "unknown"; }
}
const dimChecks = {
  "public/assets/brand/App_Icons/icon-192.png": "192x192",
  "public/assets/brand/App_Icons/icon-512.png": "512x512",
  "public/assets/brand/App_Icons/maskable-192.png": "192x192",
  "public/assets/brand/App_Icons/maskable-512.png": "512x512",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png": "1024x1024"
};
for (const [p, want] of Object.entries(dimChecks)) {
  if (!fs.existsSync(p)) continue;
  const got = size(p);
  if (got !== "unknown" && got !== want) {
    const prefix = STRICT ? "ERROR" : "WARNING";
    console.log(`${prefix}: BAD_SIZE: ${p} -> ${got} (want ${want})`);
    miss = 1;
  }
}

if (miss) {
  if (STRICT) {
    console.error("❌ Icon verification failed. Build cannot continue in strict mode.");
    console.error("   To allow web builds without mobile icons, run without STRICT_ICONS=true");
    process.exit(1);
  } else {
    console.log("⚠️  Icon verification warnings detected (non-strict mode).");
    console.log("   These are required for iOS/mobile builds. Set STRICT_ICONS=true to enforce.");
    process.exit(0);  // Allow build to continue
  }
}
console.log("✅ Icon set verified.");
