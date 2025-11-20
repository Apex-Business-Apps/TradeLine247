import { access, constants } from 'node:fs/promises';

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
    await access(file, constants.F_OK);
  } catch {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('✅ All required files found');
