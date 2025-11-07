import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    testTimeout: 10000, // 10 second timeout for each test
    bail: 1, // Stop test execution after first failure (fail fast in CI)
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'], // Only run unit tests
    exclude: [
      'node_modules/',
      'tests/e2e/**',
      'tests/accessibility/**',
      'tests/performance/**',
      'tests/security/**',
      '**/*.config.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/types.ts',
        'src/integrations/supabase/types.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
