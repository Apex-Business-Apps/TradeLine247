import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const functionsDir = path.join(rootDir, 'supabase', 'functions');
const npmImportRegex = /['"]npm:([^'\"]+)['"]/g;
const allowedPackages = [/^date-fns@/, /^date-fns-tz@/];
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

    let match;
    while ((match = npmImportRegex.exec(content)) !== null) {
      const specifier = match[1];
      const isAllowed = allowedPackages.some((pattern) => pattern.test(specifier));
      if (!isAllowed) {
        violations.push({ file: path.relative(rootDir, entryPath), specifier });
        break;
      }
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
  for (const { file, specifier } of violations) {
    console.error(`  - ${file} (${specifier})`);
  }
  console.error('Use npm: imports only for approved modules (date-fns, date-fns-tz) or switch to an allowed CDN.');
  process.exit(1);
}

console.log('[check-edge-imports] No unsupported "npm:" imports detected in Supabase functions.');
