import { access, constants } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

const requiredFiles = [
  'src/integrations/supabase/client.ts',
  'src/App.tsx',
  'src/main.tsx',
  'package.json',
  'vite.config.ts'
];

let missingFiles = [];

for (const file of requiredFiles) {
  try {
    await access(join(repoRoot, file), constants.F_OK);
  } catch {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('✅ All required files found');
