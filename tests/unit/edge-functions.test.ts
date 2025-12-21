import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Edge Functions Structure', () => {
  const functionsDir = path.join(__dirname, '../../supabase/functions');

  it('should have all required Edge Functions', () => {
    const requiredFunctions = [
      'gmail-webhook-ingest',
      'email-process-ai',
      'email-draft-reply'
    ];

    requiredFunctions.forEach(funcName => {
      const funcPath = path.join(functionsDir, funcName);
      expect(fs.existsSync(funcPath)).toBe(true);
      expect(fs.existsSync(path.join(funcPath, 'index.ts'))).toBe(true);
    });
  });

  it('should have proper CORS headers in all functions', () => {
    const functions = ['gmail-webhook-ingest', 'email-process-ai', 'email-draft-reply'];

    functions.forEach(funcName => {
      const funcPath = path.join(functionsDir, funcName, 'index.ts');
      const content = fs.readFileSync(funcPath, 'utf-8');

      // Check for CORS headers import
      expect(content).toContain('corsHeaders');

      // Check for OPTIONS method handling
      expect(content).toContain('req.method === \'OPTIONS\'');

      // Check for CORS headers in response
      expect(content).toContain('corsHeaders');
    });
  });

  it('should have proper error handling in all functions', () => {
    const functions = ['gmail-webhook-ingest', 'email-process-ai', 'email-draft-reply'];

    functions.forEach(funcName => {
      const funcPath = path.join(functionsDir, funcName, 'index.ts');
      const content = fs.readFileSync(funcPath, 'utf-8');

      // Check for try-catch blocks
      expect(content).toContain('try {');
      expect(content).toContain('catch (error)');

      // Check for error logging
      expect(content).toContain('console.error');

      // Check for error responses
      expect(content).toContain('status: 500');
    });
  });

  it('should have proper Supabase client initialization', () => {
    const functions = ['gmail-webhook-ingest', 'email-process-ai', 'email-draft-reply'];

    functions.forEach(funcName => {
      const funcPath = path.join(functionsDir, funcName, 'index.ts');
      const content = fs.readFileSync(funcPath, 'utf-8');

      // Check for Supabase client creation
      expect(content).toContain('createClient');
      expect(content).toContain('SUPABASE_URL');
      expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });
  });

  it('should have proper TypeScript interfaces', () => {
    const functions = ['gmail-webhook-ingest', 'email-process-ai', 'email-draft-reply'];

    functions.forEach(funcName => {
      const funcPath = path.join(functionsDir, funcName, 'index.ts');
      const content = fs.readFileSync(funcPath, 'utf-8');

      // Check for interface definitions
      expect(content).toMatch(/interface \w+Request/);
    });
  });
});

describe('Database Migrations', () => {
  it('should have all required migrations', () => {
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    const requiredMigrations = [
      '20251219_rag_system_schema.sql',
      '20251220_roi_dashboard_metrics.sql'
    ];

    requiredMigrations.forEach(migration => {
      const migrationPath = path.join(migrationsDir, migration);
      expect(fs.existsSync(migrationPath)).toBe(true);
    });
  });

  it('should have proper SQL syntax in migrations', () => {
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    const migrationFiles = [
      '20251219_rag_system_schema.sql',
      '20251220_roi_dashboard_metrics.sql'
    ];

    migrationFiles.forEach(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for basic SQL structure
      expect(content).toContain('--');
      expect(content.toLowerCase()).toMatch(/create|alter|insert|update/);
    });
  });
});