import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.tsx'],
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**'],
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
