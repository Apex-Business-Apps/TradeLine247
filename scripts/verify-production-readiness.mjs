#!/usr/bin/env node

/**
 * Production Readiness Verification
 * Final comprehensive check for enterprise deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const checks = [
  // Database & Schema
  { name: 'Enterprise Database Schema', check: () => {
    const migrations = fs.readdirSync(path.join(__dirname, '..', 'supabase', 'migrations'));
    return migrations.filter(f => f.includes('enterprise') || f.includes('booking')).length >= 2;
  }},

  // Security Features
  { name: 'Security Middleware', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'security-middleware.ts'));
  }},

  { name: 'Enterprise Monitoring', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'enterprise-monitoring.ts'));
  }},

  // API Functions
  { name: 'Booking API', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', 'create-booking', 'index.ts'));
  }},

  { name: 'Calendar Integration', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', 'sync-calendar-event', 'index.ts'));
  }},

  { name: 'Health Check API', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'supabase', 'functions', 'health-check', 'index.ts'));
  }},

  // Frontend Components
  { name: 'Booking Components', check: () => {
    const components = ['CreditCardDialog.tsx', 'CalendarIntegration.tsx'];
    return components.every(c => fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'booking', c)));
  }},

  { name: 'Admin Dashboard', check: () => {
    const components = ['EscalationManagement.tsx', 'EnterpriseDashboard.tsx'];
    return components.every(c => fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'admin', c)));
  }},

  { name: 'AI Onboarding', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'onboarding', 'AIOnboardingWizard.tsx'));
  }},

  // Quality Assurance
  { name: 'TypeScript Compilation', check: () => {
    try {
      const { execSync } = require('child_process');
      execSync('npm run typecheck', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  }},

  { name: 'ESLint Validation', check: () => {
    try {
      const { execSync } = require('child_process');
      execSync('npm run lint', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  }},

  { name: 'Build Process', check: () => {
    try {
      const { execSync } = require('child_process');
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return fs.existsSync(path.join(__dirname, '..', 'dist'));
    } catch (e) {
      return false;
    }
  }},

  { name: 'Unit Tests', check: () => {
    try {
      const { execSync } = require('child_process');
      execSync('npm run test:ci', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  }},

  // Security & Compliance
  { name: 'Security Headers', check: () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const headers = ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options'];
    return headers.every(h => html.includes(h));
  }},

  { name: 'Performance Budgets', check: () => {
    return fs.existsSync(path.join(__dirname, '..', '.lighthousebudgets.json'));
  }}
];

console.log('🔍 Production Readiness Verification');
console.log('=====================================\n');

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

console.log('\n=====================================');
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('✨ TradeLine 24/7 is production-ready!');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed.');
  console.log('🔧 Please address failed items before deployment.');
  process.exit(1);
}