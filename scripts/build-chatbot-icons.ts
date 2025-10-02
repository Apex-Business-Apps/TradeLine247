import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";

const sizes = [64, 128, 256, 512];
const inputFile = "public/icons/chatbot-original.png";
const outputDir = "public/icons";

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log("Generating chatbot icons...");
  
  for (const size of sizes) {
    const outputFile = `${outputDir}/chatbot-${size}.png`;
    await sharp(inputFile)
      .resize(size, size, { 
        fit: "contain", 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .png()
      .toFile(outputFile);
    console.log(`✓ Generated ${outputFile}`);
  }
  
  console.log("All icons generated successfully!");
}

generateIcons().catch(console.error);
