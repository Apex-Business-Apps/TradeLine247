import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

const isCI = !!process.env.CI;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    watch: !isCI,
    reporters: isCI ? ['basic'] : ['default'],
    setupFiles: ['src/setupTests.tsx'],
    globals: true,
    css: true,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      // NOTE: Deno-based Supabase function tests excluded (use 'deno test' instead)
    ],
    exclude: [
      'tests/**', // Playwright e2e tests
      'node_modules/**',
      'supabase/functions/**', // Deno runtime tests (https:// imports incompatible with Node)
    ]
    // Ensure Node.js built-ins and modules are available for tests
    server: {
      deps: {
        inline: [
          '@supabase/supabase-js',
          '@/integrations/supabase/client',
          '@/lib/ensureMembership',
        ],
      },
    },
    // Set up environment variables for tests
    environmentVariables: {
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/setupTests.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        'src/main.tsx',
        'src/safe-mode.ts',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
