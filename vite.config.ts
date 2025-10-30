import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'development' ? [componentTagger()] : []),
  ],
  server: {
    port: 8080,
    host: "::",
  },
  preview: {
    port: 8080,
    host: "::",
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
}));
