#!/usr/bin/env node
/**
 * HERMES3 Cleanup Verification
 *
 * Verifies that all HERMES3-related files have been removed from the codebase.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

console.log('\n🧹 HERMES3 Cleanup Verification\n');
console.log('═'.repeat(50));

const issues = [];

// Patterns that should not exist
const forbiddenPatterns = [
  /hermes3/i,
  /HERMES3/,
  /Hermes3/,
];

// Files/directories that should not exist
const forbiddenPaths = [
  'docs/HERMES3_ARCHITECTURE.md',
  'docs/HERMES3_INTEGRATION.md',
  'docs/HERMES3_DEPLOYMENT.md',
  'docs/HERMES3_API.md',
  'docs/HERMES3_SETUP.md',
  'src/components/ui/Hermes3Chat.tsx',
  'src/lib/hermes3Streaming.ts',
  'supabase/functions/hermes3',
  'supabase/functions/hermes3-chat',
  'supabase/functions/hermes3-stream',
];

// Check for forbidden paths
console.log('\n📁 Checking for forbidden files/directories:');
let pathsClean = true;
for (const path of forbiddenPaths) {
  const fullPath = join(ROOT, path);
  if (existsSync(fullPath)) {
    issues.push(`Found forbidden path: ${path}`);
    console.log(`  ✗ ${path} still exists`);
    pathsClean = false;
  }
}
if (pathsClean) {
  console.log('  ✓ No forbidden files/directories found');
}

// Recursive search for hermes references
function searchInDirectory(dir, depth = 0) {
  if (depth > 10) return; // Prevent infinite recursion

  const skipDirs = ['node_modules', '.git', 'dist', 'coverage', '.next', 'build'];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = fullPath.replace(ROOT + '/', '');

      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          searchInDirectory(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        // Check filename
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(entry.name)) {
            issues.push(`Filename contains HERMES3: ${relativePath}`);
          }
        }

        // Check file contents for specific file types
        const ext = entry.name.split('.').pop()?.toLowerCase();
        const checkableExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'sql'];

        if (checkableExts.includes(ext || '')) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            for (const pattern of forbiddenPatterns) {
              if (pattern.test(content)) {
                // Only report if it's not in a comment or old changelog
                if (!relativePath.includes('CHANGELOG') && !relativePath.includes('archive')) {
                  issues.push(`File contains HERMES3 reference: ${relativePath}`);
                  break;
                }
              }
            }
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (e) {
    // Skip directories that can't be read
  }
}

console.log('\n🔍 Scanning codebase for HERMES3 references...');
searchInDirectory(ROOT);

// Check specific locations
console.log('\n📂 Checking key locations:');

// Check docs folder
const docsDir = join(ROOT, 'docs');
if (existsSync(docsDir)) {
  const docsFiles = readdirSync(docsDir, { recursive: true });
  const hermesDocs = docsFiles.filter(f =>
    typeof f === 'string' && forbiddenPatterns.some(p => p.test(f))
  );
  if (hermesDocs.length === 0) {
    console.log('  ✓ docs/ - clean');
  } else {
    console.log(`  ✗ docs/ - found ${hermesDocs.length} HERMES3 files`);
  }
}

// Check src folder
const srcDir = join(ROOT, 'src');
if (existsSync(srcDir)) {
  console.log('  ✓ src/ - checking...');
}

// Check supabase functions
const functionsDir = join(ROOT, 'supabase/functions');
if (existsSync(functionsDir)) {
  const functions = readdirSync(functionsDir);
  const hermesFunctions = functions.filter(f =>
    forbiddenPatterns.some(p => p.test(f))
  );
  if (hermesFunctions.length === 0) {
    console.log('  ✓ supabase/functions/ - clean');
  } else {
    console.log(`  ✗ supabase/functions/ - found ${hermesFunctions.length} HERMES3 functions`);
  }
}

// Summary
console.log('\n═'.repeat(50));
console.log('\n📋 Cleanup Verification Summary:\n');

if (issues.length === 0) {
  console.log('✅ HERMES3 cleanup verified!');
  console.log('   No HERMES3 references found in the codebase.\n');
} else {
  console.log(`❌ Found ${issues.length} HERMES3 references:\n`);
  for (const issue of issues) {
    console.log(`   - ${issue}`);
  }
  console.log('\nPlease remove these references before proceeding.\n');
}

process.exit(issues.length > 0 ? 1 : 0);
