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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-navigation-menu'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
    cssCodeSplit: true,
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
