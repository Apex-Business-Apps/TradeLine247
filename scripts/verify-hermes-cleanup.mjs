#!/usr/bin/env node

/**
 * HERMES3 Cleanup Verification
 * Final verification that all HERMES3 references have been removed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const checks = [
  {
    name: 'HERMES3 Documentation Files',
    check: () => {
      const docsDir = path.join(__dirname, '..', 'docs');
      const files = fs.readdirSync(docsDir);
      const hermesFiles = files.filter(f => f.toLowerCase().includes('hermes'));
      return hermesFiles.length === 0;
    }
  },
  {
    name: 'Hermes3Chat Component',
    check: () => {
      const componentPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'Hermes3Chat.tsx');
      return !fs.existsSync(componentPath);
    }
  },
  {
    name: 'hermes3Streaming Library',
    check: () => {
      const libPath = path.join(__dirname, '..', 'src', 'lib', 'hermes3Streaming.ts');
      return !fs.existsSync(libPath);
    }
  },
  {
    name: 'hermes3 Supabase Function',
    check: () => {
      const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'hermes3');
      return !fs.existsSync(functionPath);
    }
  },
  {
    name: 'Hermes3Demo Page',
    check: () => {
      const pagePath = path.join(__dirname, '..', 'src', 'pages', 'Hermes3Demo.tsx');
      return !fs.existsSync(pagePath);
    }
  },
  {
    name: 'README.md HERMES References',
    check: () => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      if (!fs.existsSync(readmePath)) return false;

      const content = fs.readFileSync(readmePath, 'utf8');
      const hermesRefs = (content.match(/HERMES|hermes/gi) || []).length;
      return hermesRefs === 0;
    }
  },
  {
    name: 'Codebase HERMES References',
    check: () => {
      // This is a simplified check - in production you'd use a more comprehensive search
      const srcDir = path.join(__dirname, '..', 'src');
      let totalHermesRefs = 0;

      function scanDir(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(filePath);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const hermesMatches = (content.match(/HERMES|hermes/gi) || []).length;
              totalHermesRefs += hermesMatches;
            } catch (error) {
              // Skip binary files or files that can't be read
            }
          }
        }
      }

      scanDir(srcDir);
      return totalHermesRefs === 0;
    }
  }
];

console.log('🔍 HERMES3 Cleanup Verification');
console.log('=================================\n');

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  process.stdout.write(`Checking: ${name}... `);

  try {
    const result = check();
    if (result) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ ERROR');
    failed++;
  }
});

console.log('\n=================================');
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 SUCCESS: All HERMES3 references have been completely removed!');
  console.log('✨ The codebase is now clean of any HERMES3 dependencies.');
  process.exit(0);
} else {
  console.log('⚠️  Some HERMES3 references still remain.');
  console.log('🔧 Please review and remove remaining references.');
  process.exit(1);
}
