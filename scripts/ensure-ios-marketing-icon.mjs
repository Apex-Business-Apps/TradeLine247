import fs from "fs";
import path from "path";

import fs from "fs";
import path from "path";

const ICONSET_DIR =
  process.env.IOS_APPICONSET_DIR ||
  "ios/App/App/Assets.xcassets/AppIcon.appiconset";
const CONTENTS = path.join(ICONSET_DIR, "Contents.json");
const DST = path.join(ICONSET_DIR, "icon-1024.png");

const sourcePriority = [
  process.env.IOS_MARKETING_ICON_SRC,
  "public/assets/brand/App_Icons/ios/AppStore1024.png",
  "assets/AppIcon.appiconset/icon-1024.png",
];

function mustExist(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing ${label}: ${p}`);
    process.exit(1);
  }
}

function findFirstExisting(paths) {
  for (const p of paths) {
    if (!p) continue;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findAny1024Png() {
  const matches = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (/\.png$/i.test(entry) && /1024/.test(entry)) {
        matches.push(full);
      }
    }
  }
  walk(process.cwd());
  return matches[0] || null;
}

function findLargestInIconset() {
  const files = fs.readdirSync(ICONSET_DIR).filter((f) => f.toLowerCase().endsWith(".png"));
  if (!files.length) return null;
  let best = files[0];
  for (const f of files) {
    const full = path.join(ICONSET_DIR, f);
    if (fs.statSync(full).size > fs.statSync(path.join(ICONSET_DIR, best)).size) {
      best = f;
    }
  }
  return path.join(ICONSET_DIR, best);
}

mustExist(ICONSET_DIR, "AppIcon.appiconset directory (IOS_APPICONSET_DIR)");
mustExist(CONTENTS, "Contents.json in AppIcon set");

let src =
  findFirstExisting(sourcePriority) ||
  findAny1024Png() ||
  findLargestInIconset();

if (!src) {
  console.error("❌ No suitable source icon found (1024px). Set IOS_MARKETING_ICON_SRC.");
  process.exit(1);
}

if (src === findLargestInIconset()) {
  console.warn(`⚠️ Using largest existing icon in AppIcon set as fallback: ${src}`);
}

fs.copyFileSync(src, DST);
console.log(`✅ Ensured marketing icon file: ${DST} (source: ${src})`);

const json = JSON.parse(fs.readFileSync(CONTENTS, "utf8"));
json.images = Array.isArray(json.images) ? json.images : [];

const desired = {
  idiom: "ios-marketing",
  size: "1024x1024",
  scale: "1x",
  filename: "icon-1024.png",
};

const idx = json.images.findIndex((img) => img?.idiom === "ios-marketing");
if (idx >= 0) json.images[idx] = { ...json.images[idx], ...desired };
else json.images.push(desired);

fs.writeFileSync(CONTENTS, JSON.stringify(json, null, 2) + "\n");

const ok = json.images.some(
  (img) =>
    img?.idiom === "ios-marketing" &&
    img?.filename === "icon-1024.png" &&
    img?.size === "1024x1024" &&
    img?.scale === "1x"
);
if (!ok) {
  console.error("❌ Contents.json missing correct ios-marketing entry.");
  process.exit(1);
}
console.log("✅ iOS marketing icon enforcement complete.");

