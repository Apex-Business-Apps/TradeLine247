import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  base: "/",
  server: { 
    host: "::",
    port: 8080, 
    strictPort: true,
    cors: true
  },
  preview: { 
    port: 4173, 
    strictPort: true,
    host: true,
    cors: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: false, // Disable sourcemaps in production for better performance
    outDir: "dist",
    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching and parallel loading
        manualChunks: {
          // Core React (rarely changes, good for long-term caching)
          'react-vendor': ['react', 'react-dom'],

          // React Router (changes moderately)
          'react-router': ['react-router-dom'],

          // Supabase (large, rarely changes)
          'supabase': ['@supabase/supabase-js'],

          // React Query (data fetching)
          'react-query': ['@tanstack/react-query'],

          // UI components by category (better granularity)
          'radix-primitives': [
            '@radix-ui/react-slot',
          ],
          'radix-overlays': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-navigation-menu',
          ],
          'radix-forms': [
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-label',
          ],
        },
        // Optimize chunk sizes
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    cssCodeSplit: true,
    // Increase chunk size warning limit (we have good code splitting)
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        // SECURITY FIX: Keep console.error/warn in production for error monitoring
        // Only drop console.log/debug to reduce noise
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.trace']
      },
    },
  },
}));
