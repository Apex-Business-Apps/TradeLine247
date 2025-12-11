import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, 'public/assets/brand/App_Icons/ios/AppStore1024.png');

const publicIcons = [
  { name: 'iPhoneApp180.png', size: 180 },
  { name: 'iPhoneSpotlight120.png', size: 120 },
  { name: 'iPadApp152.png', size: 152 },
  { name: 'iPadApp167.png', size: 167 }
];

const xcassetsIcons = [
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 }
];

const contentsJson = {
  "images": [
    {
      "filename": "icon-20@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "20x20"
    },
    {
      "filename": "icon-20@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "20x20"
    },
    {
      "filename": "icon-29@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "29x29"
    },
    {
      "filename": "icon-29@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "29x29"
    },
    {
      "filename": "icon-40@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "40x40"
    },
    {
      "filename": "icon-40@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "40x40"
    },
    {
      "filename": "icon-60@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "60x60"
    },
    {
      "filename": "icon-60@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "60x60"
    },
    {
      "filename": "icon-20@2x.png",
      "idiom": "ipad",
      "scale": "2x",
      "size": "20x20"
    },
    {
      "filename": "icon-29@2x.png",
      "idiom": "ipad",
      "scale": "2x",
      "size": "29x29"
    },
    {
      "filename": "icon-40@2x.png",
      "idiom": "ipad",
      "scale": "2x",
      "size": "40x40"
    },
    {
      "filename": "icon-76@2x.png",
      "idiom": "ipad",
      "scale": "2x",
      "size": "76x76"
    },
    {
      "filename": "icon-83.5@2x.png",
      "idiom": "ipad",
      "scale": "2x",
      "size": "83.5x83.5"
    },
    {
      "filename": "icon-1024.png",
      "idiom": "ios-marketing",
      "scale": "1x",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
};

async function resizeIcons() {
  console.log('Starting icon resize process...\n');

  // Create directories
  const publicDir = path.join(__dirname, 'public/assets/brand/App_Icons/ios');
  const xcassetsDir = path.join(__dirname, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log(`✓ Created directory: ${publicDir}`);
  }

  if (!fs.existsSync(xcassetsDir)) {
    fs.mkdirSync(xcassetsDir, { recursive: true });
    console.log(`✓ Created directory: ${xcassetsDir}`);
  }

  // Resize public icons
  console.log('\nResizing icons for public/assets/brand/App_Icons/ios/...');
  for (const icon of publicIcons) {
    const outputPath = path.join(publicDir, icon.name);
    await sharp(sourceIcon)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Created ${icon.name} (${icon.size}×${icon.size})`);
  }

  // Resize xcassets icons
  console.log('\nResizing icons for ios/App/App/Assets.xcassets/AppIcon.appiconset/...');
  for (const icon of xcassetsIcons) {
    const outputPath = path.join(xcassetsDir, icon.name);
    await sharp(sourceIcon)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Created ${icon.name} (${icon.size}×${icon.size})`);
  }

  // Write Contents.json
  const contentsPath = path.join(xcassetsDir, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));
  console.log('\n✓ Created Contents.json');

  console.log('\n✅ All icons created successfully!');
}

resizeIcons().catch(err => {
  console.error('Error resizing icons:', err);
  process.exit(1);
});
