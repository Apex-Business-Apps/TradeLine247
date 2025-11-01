import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [react()];

  // ENHANCED: Better Lovable tagger detection and configuration
  const taggerEnv = process.env.LOVABLE_COMPONENT_TAGGER?.toLowerCase();
  const isDevMode = command === "serve";
  const isExplicitlyEnabled = taggerEnv === "true";
  const isExplicitlyDisabled = taggerEnv === "false";

  // Enable tagger in these scenarios:
  // 1. Explicitly enabled via LOVABLE_COMPONENT_TAGGER=true
  // 2. In dev mode (serve) unless explicitly disabled
  // 3. When running in Lovable preview environment
  const shouldEnableTagger =
    isExplicitlyEnabled || (!isExplicitlyDisabled && isDevMode);

  if (shouldEnableTagger) {
    try {
      console.log("🎨 Enabling Lovable component tagger...");
      const { componentTagger } = await import("lovable-tagger");
      const maybePlugins = componentTagger();

      if (Array.isArray(maybePlugins)) {
        plugins.push(...maybePlugins);
        console.log(`✅ Loaded ${maybePlugins.length} Lovable tagger plugins`);
      } else if (maybePlugins) {
        plugins.push(maybePlugins);
        console.log("✅ Loaded Lovable tagger plugin");
      }
    } catch (error) {
      console.warn("⚠️  Failed to load lovable-tagger:", error);
      console.warn("   Lovable editor may not function properly");
      console.warn("   Run: npm install lovable-tagger@latest");
    }
  } else {
    console.log("ℹ️  Lovable component tagger disabled");
    if (isExplicitlyDisabled) {
      console.log("   (explicitly disabled via LOVABLE_COMPONENT_TAGGER=false)");
    }
  }

  return {
    plugins,
    server: {
      port: 8080,
      host: true,
      // ENHANCED: Add CORS headers for Lovable preview environments
      cors: true,
      strictPort: false, // Allow fallback to another port if 8080 is busy
    },
    preview: {
      port: 8080,
      host: true,
      cors: true,
      strictPort: false,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      sourcemap: true, // Enable source maps for debugging (use 'hidden' for production)
      outDir: "dist",
      // PERFORMANCE: Increase chunk size warning limit after optimization
      chunkSizeWarningLimit: 600,
      
      rollupOptions: {
        onwarn(warning: any, warn: any) {
          // Suppress certain warnings that don't affect Lovable integration
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        },
        // PERFORMANCE: Manual chunk splitting for optimal caching and parallel downloads
        output: {
          manualChunks: (id) => {
            // Vendor chunk: React and React DOM (stable, changes infrequently)
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            
            // Vendor chunk: React Router (stable)
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            
            // Vendor chunk: Radix UI components (stable UI library)
            if (id.includes('node_modules/@radix-ui')) {
              return 'vendor-ui';
            }
            
            // Vendor chunk: Form libraries (react-hook-form, zod, etc.)
            if (id.includes('node_modules/react-hook-form') ||
                id.includes('node_modules/@hookform') ||
                id.includes('node_modules/zod')) {
              return 'vendor-form';
            }
            
            // Vendor chunk: Data fetching (TanStack Query, Supabase)
            if (id.includes('node_modules/@tanstack/react-query') ||
                id.includes('node_modules/@supabase')) {
              return 'vendor-data';
            }
            
            // Vendor chunk: Charts (recharts)
            if (id.includes('node_modules/recharts')) {
              return 'vendor-charts';
            }
            
            // Vendor chunk: Utilities (date-fns, lucide-react, etc.)
            if (id.includes('node_modules/date-fns') ||
                id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge') ||
                id.includes('node_modules/class-variance-authority')) {
              return 'vendor-utils';
            }
            
            // Vendor chunk: Remaining node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // PERFORMANCE: Optimize asset file naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          // PERFORMANCE: Separate chunks for each route (code splitting)
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // PERFORMANCE: Minification with Terser for better compression
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Keep console for debugging (set to true in production if desired)
          drop_debugger: true,
          pure_funcs: ['console.debug'], // Remove only debug logs
        },
      },
    },
    // ENHANCED: Optimize dependencies for faster reloads in Lovable
    optimizeDeps: {
      exclude: [], // Can exclude large deps that don't need pre-bundling
    },
  };
});
