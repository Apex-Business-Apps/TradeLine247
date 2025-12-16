import fs from "fs";
import path from "path";

const SRC = "public/assets/brand/App_Icons/ios/AppStore1024.png";
const DST = "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png";

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

const dstDir = path.dirname(DST);
fs.mkdirSync(dstDir, { recursive: true });

if (!exists(SRC)) {
  console.error(`Missing source icon: ${SRC}`);
  process.exit(1);
}

if (!exists(DST)) {
  fs.copyFileSync(SRC, DST);
  console.log(`Restored iOS 1024 icon -> ${DST}`);
} else {
  console.log(`iOS 1024 icon already present -> ${DST}`);
}
