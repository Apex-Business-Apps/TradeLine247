import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(async ({ command }) => {
  const plugins = [react()];

  const taggerEnv = process.env.LOVABLE_COMPONENT_TAGGER?.toLowerCase();
  const shouldEnableTagger =
    taggerEnv === "true" || (taggerEnv !== "false" && command === "serve");

  if (shouldEnableTagger) {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger());
  }

  return {
    plugins,
    server: {
      port: 8080,
      host: true,
    },
    preview: {
      port: 8080,
      host: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      sourcemap: false,
      outDir: "dist",
    },
  };
});
