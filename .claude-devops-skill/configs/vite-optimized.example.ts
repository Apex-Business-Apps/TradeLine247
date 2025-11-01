/**
 * 🚀 OPTIMIZED VITE CONFIGURATION
 *
 * Production-ready Vite config with:
 * - Maximum build optimization
 * - Code splitting strategies
 * - Compression and minification
 * - Performance best practices
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better DX
      fastRefresh: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Build optimization
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,

    // Minification
    minify: 'esbuild',

    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
          ],
          'query-vendor': ['@tanstack/react-query', 'swr'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase': ['@supabase/supabase-js'],

          // Utility chunks
          'utils': [
            'clsx',
            'tailwind-merge',
            'date-fns',
            'libphonenumber-js',
          ],
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },

      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Disable CSS minification in development
    cssMinify: process.env.NODE_ENV === 'production',

    // Report compressed size
    reportCompressedSize: true,
  },

  // Development server
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,

    // CORS
    cors: true,

    // HMR
    hmr: {
      overlay: true,
    },
  },

  // Preview server (for production builds)
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // Esbuild optimization
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],

    // Legal comments
    legalComments: 'none',

    // Target
    target: 'es2020',
  },

  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
    __PROD__: process.env.NODE_ENV === 'production',
  },
});
