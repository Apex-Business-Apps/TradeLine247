import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const optimizeLogo = async () => {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/logo-optimized.png');

  console.log('🖼️  Optimizing logo...');
  console.log(`Input: ${inputPath}`);

  const inputSize = fs.statSync(inputPath).size;
  console.log(`Original size: ${(inputSize / 1024 / 1024).toFixed(2)}MB`);

  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .png({
      quality: 85,
      compressionLevel: 9,
      palette: true,
      colors: 256
    })
    .toFile(outputPath);

  const outputSize = fs.statSync(outputPath).size;

  console.log(`Optimized size: ${(outputSize / 1024).toFixed(2)}KB`);
  console.log(`Reduction: ${((1 - outputSize / inputSize) * 100).toFixed(1)}%`);

  // Replace originals
  console.log('\n📝 Replacing original files...');
  fs.copyFileSync(outputPath, path.join(__dirname, '../public/logo.png'));
  fs.copyFileSync(outputPath, path.join(__dirname, '../src/assets/logo.png'));

  // Clean up optimized temp file
  fs.unlinkSync(outputPath);

  console.log('✅ Logos optimized successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test: npm run preview');
  console.log('3. Verify Lighthouse score improved');
};

optimizeLogo().catch(error => {
  console.error('❌ Error optimizing logo:', error);
  process.exit(1);
});
