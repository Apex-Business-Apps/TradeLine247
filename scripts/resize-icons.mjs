import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

// SOURCE: Master icon (1024×1024)
const SOURCE = 'public/assets/brand/App_Icons/ios/AppStore1024.png';

const WEB_DIR = 'public/assets/brand/App_Icons/ios';
const XCODE_DIR = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';

const ICONS = [
  // Web/PWA (keeping existing + ensuring all required)
  { size: 180, dir: WEB_DIR, name: 'iPhoneApp180.png' },
  { size: 120, dir: WEB_DIR, name: 'iPhoneSpotlight120.png' },
  { size: 152, dir: WEB_DIR, name: 'iPadApp152.png' },
  { size: 167, dir: WEB_DIR, name: 'iPadApp167.png' },
  // Xcode Asset Catalog
  { size: 40, dir: XCODE_DIR, name: 'icon-20@2x.png' },
  { size: 60, dir: XCODE_DIR, name: 'icon-20@3x.png' },
  { size: 58, dir: XCODE_DIR, name: 'icon-29@2x.png' },
  { size: 87, dir: XCODE_DIR, name: 'icon-29@3x.png' },
  { size: 80, dir: XCODE_DIR, name: 'icon-40@2x.png' },
  { size: 120, dir: XCODE_DIR, name: 'icon-40@3x.png' },
  { size: 120, dir: XCODE_DIR, name: 'icon-60@2x.png' },
  { size: 180, dir: XCODE_DIR, name: 'icon-60@3x.png' },
  { size: 152, dir: XCODE_DIR, name: 'icon-76@2x.png' },
  { size: 167, dir: XCODE_DIR, name: 'icon-83.5@2x.png' },
  { size: 1024, dir: XCODE_DIR, name: 'icon-1024.png' },
];

async function resize() {
  console.log(`📦 Using master icon: ${SOURCE}`);

  for (const { size, dir, name } of ICONS) {
    const output = path.join(dir, name);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', position: 'center', kernel: 'lanczos3' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(output);
    console.log(`✅ ${output} (${size}×${size})`);
  }

  console.log('\n✅ All icons created from master icon.');
  console.log(`📊 Total: ${ICONS.length} icons generated`);
}

resize().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
