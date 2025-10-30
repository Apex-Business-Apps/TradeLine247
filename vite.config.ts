import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(async ({ command }) => {
  const plugins = [react()];

  const taggerEnv = process.env.LOVABLE_COMPONENT_TAGGER?.toLowerCase();
  const shouldEnableTagger =
    taggerEnv === "true" || (taggerEnv !== "false" && command === "serve");

  if (shouldEnableTagger) {
    const { componentTagger } = await import("lovable-tagger");
    const maybePlugins = componentTagger() as PluginOption | PluginOption[] | undefined;

    if (Array.isArray(maybePlugins)) {
      plugins.push(...maybePlugins);
    } else if (maybePlugins) {
      plugins.push(maybePlugins);
    }
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
