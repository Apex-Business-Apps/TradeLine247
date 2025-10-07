import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync } from "fs";

const USE_SAMSUNG_PWA = true; // Toggle flag for Samsung vs final icons

const outputDir = "public";

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function generatePWAIcons() {
  console.log(`\n🎨 PWA Icon Generation`);
  console.log(`USE_SAMSUNG_PWA: ${USE_SAMSUNG_PWA}\n`);

  const sourceFile = USE_SAMSUNG_PWA 
    ? "public/galaxy_store_icon_512.png" 
    : "public/master_icon_1024.png";

  if (!existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  // Generate PWA icons for Android Chrome
  const pwaConfig = [
    { size: 192, name: "android-chrome-192x192.png" },
    { size: 512, name: "android-chrome-512x512.png" },
  ];

  for (const config of pwaConfig) {
    const outputFile = `${outputDir}/${config.name}`;
    await sharp(sourceFile)
      .resize(config.size, config.size, { 
        fit: "contain", 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .png()
      .toFile(outputFile);
    console.log(`✓ Generated ${outputFile}`);
  }

  // Generate iOS touch icon (180x180) from iOS master
  const iosTouchIconSource = "ios/App/App/Assets.xcassets/AppIcon.appiconset/app_store_1024.png";
  if (existsSync(iosTouchIconSource)) {
    await sharp(iosTouchIconSource)
      .resize(180, 180, { 
        fit: "contain", 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .png()
      .toFile(`${outputDir}/apple-touch-icon.png`);
    console.log(`✓ Generated ${outputDir}/apple-touch-icon.png`);
  }

  // Generate favicons (16x16, 32x32)
  const faviconSizes = [16, 32];
  for (const size of faviconSizes) {
    const outputFile = `${outputDir}/favicon-${size}x${size}.png`;
    await sharp(sourceFile)
      .resize(size, size, { 
        fit: "contain", 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .png()
      .toFile(outputFile);
    console.log(`✓ Generated ${outputFile}`);
  }

  // Generate standard favicon.ico equivalent (32x32 as PNG)
  await sharp(sourceFile)
    .resize(32, 32, { 
      fit: "contain", 
      background: { r: 0, g: 0, b: 0, alpha: 0 } 
    })
    .png()
    .toFile(`${outputDir}/favicon.png`);
  console.log(`✓ Generated ${outputDir}/favicon.png`);

  console.log("\n✅ All PWA icons generated successfully!");
  console.log(`\n📝 Remember: USE_SAMSUNG_PWA is currently set to ${USE_SAMSUNG_PWA}`);
  console.log(`   To switch to final icons, set USE_SAMSUNG_PWA = false and re-run this script.\n`);
}

generatePWAIcons().catch(console.error);
