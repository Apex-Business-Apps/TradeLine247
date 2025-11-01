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
      sourcemap: false,
      outDir: "dist",
      // ENHANCED: Better error reporting during builds
      rollupOptions: {
        onwarn(warning: any, warn: any) {
          // Suppress certain warnings that don't affect Lovable integration
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        },
      },
    },
    // ENHANCED: Optimize dependencies for faster reloads in Lovable
    optimizeDeps: {
      exclude: [], // Can exclude large deps that don't need pre-bundling
    },
  };
});
