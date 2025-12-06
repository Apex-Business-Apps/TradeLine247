#!/usr/bin/env node

/**
 * Simple Enterprise Validation Script
 * Tests each enterprise feature individually
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  {
    name: 'Database Schema - Enterprise Tables',
    check: () => {
      const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
      const files = fs.readdirSync(migrationDir);
      const enterpriseFiles = files.filter(f =>
        f.includes('enterprise') || f.includes('booking') || f.includes('security')
      );
      return enterpriseFiles.length >= 3;
    }
  },
  {
    name: 'Security Middleware Files',
    check: () => {
      const files = [
        'supabase/functions/_shared/enterprise-monitoring.ts',
        'supabase/functions/_shared/security-middleware.ts'
      ];
      return files.every(f => fs.existsSync(path.join(__dirname, '..', f)));
    }
  },
  {
    name: 'Enhanced Functions',
    check: () => {
      const functions = [
        'create-booking',
        'send-booking-confirmation',
        'sync-calendar-event',
        'enhanced-voice-stream',
        'resolve-escalation',
        'health-check'
      ];
      return functions.every(f =>
        fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', f, 'index.ts'))
      );
    }
  },
  {
    name: 'Frontend Components',
    check: () => {
      const components = [
        'src/components/booking/CreditCardDialog.tsx',
        'src/components/booking/CalendarIntegration.tsx',
        'src/components/onboarding/AIOnboardingWizard.tsx',
        'src/components/admin/EscalationManagement.tsx',
        'src/components/admin/EnterpriseDashboard.tsx'
      ];
      return components.every(c => fs.existsSync(path.join(__dirname, '..', c)));
    }
  },
  {
    name: 'TypeScript Compilation',
    check: () => {
      try {
        execSync('npm run typecheck', {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  {
    name: 'ESLint Validation',
    check: () => {
      try {
        execSync('npm run lint', {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  {
    name: 'Build Process',
    check: () => {
      try {
        execSync('npm run build', {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        return fs.existsSync(path.join(__dirname, '..', 'dist'));
      } catch (e) {
        return false;
      }
    }
  },
  {
    name: 'Unit Tests',
    check: () => {
      try {
        execSync('npm run test:ci', {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  }
];

console.log('🚀 Enterprise Features Validation\n');
console.log('=' .repeat(40));

let passed = 0;
let failed = 0;

for (const test of tests) {
  process.stdout.write(`Testing: ${test.name}... `);

  try {
    const result = test.check();
    if (result) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }
}

console.log('\n' + '='.repeat(40));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All enterprise features validated successfully!');
  process.exit(0);
} else {
  console.log('⚠️  Some validations failed. Please review and fix.');
  process.exit(1);
}