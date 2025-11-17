#!/usr/bin/env node

// Check for required files before build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_FILES = [
  'src/integrations/supabase/client.ts',
  'src/App.tsx',
  'src/main.tsx',
  'package.json',
  'vite.config.ts'
];

console.log('🔍 Checking for required files...');

let allFound = true;

for (const file of REQUIRED_FILES) {
  try {
    if (fs.existsSync(file)) {
      console.log(`✅ Found: ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allFound = false;
    }
  } catch (error) {
    console.log(`❌ Error checking: ${file} - ${error.message}`);
    allFound = false;
  }
}

if (allFound) {
  console.log('✅ All required files found');
  process.exit(0);
} else {
  console.error('❌ Some required files are missing');
  process.exit(1);
}
