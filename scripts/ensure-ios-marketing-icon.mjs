import fs from "fs";
import path from "path";

import fs from "fs";
import path from "path";

const SRC =
  process.env.IOS_MARKETING_ICON_SRC ||
  "public/assets/brand/App_Icons/ios/AppStore1024.png";

const ICONSET_DIR =
  process.env.IOS_APPICONSET_DIR ||
  "ios/App/App/Assets.xcassets/AppIcon.appiconset";

const DST = path.join(ICONSET_DIR, "icon-1024.png");
const CONTENTS = path.join(ICONSET_DIR, "Contents.json");

function mustExist(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing ${label}: ${p}`);
    process.exit(1);
  }
}

mustExist(SRC, "source 1024 icon (IOS_MARKETING_ICON_SRC)");
mustExist(ICONSET_DIR, "AppIcon.appiconset directory (IOS_APPICONSET_DIR)");
mustExist(CONTENTS, "Contents.json in AppIcon set");

fs.copyFileSync(SRC, DST);
console.log(`✅ Ensured marketing icon file: ${DST}`);

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

