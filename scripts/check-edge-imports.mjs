import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const functionsDir = path.join(rootDir, 'supabase', 'functions');
const forbiddenPrefix = 'npm:';
const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(entryPath);
      continue;
    }

    if (!entry.name.endsWith('.ts')) {
      continue;
    }

    const content = await readFile(entryPath, 'utf8');

    if (content.includes(`"${forbiddenPrefix}`) || content.includes(`'${forbiddenPrefix}`)) {
      violations.push(path.relative(rootDir, entryPath));
    }
  }
}

try {
  await walk(functionsDir);
} catch (error) {
  console.error('[check-edge-imports] Failed to scan Supabase functions:', error);
  process.exit(1);
}

if (violations.length > 0) {
  console.error('[check-edge-imports] The following files use unsupported "npm:" imports for Edge Functions:');
  for (const file of violations) {
    console.error(`  - ${file}`);
  }
  console.error('Please replace "npm:" imports with compatible CDN URLs such as https://esm.sh/.');
  process.exit(1);
}

console.log('[check-edge-imports] No unsupported "npm:" imports detected in Supabase functions.');
