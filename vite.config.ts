import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// IMPORTANT: do not import 'fs', 'path', or other Node libs in code that runs in the browser.
// This config remains Node-only, but we neutralize 'process.env' for browser bundles to avoid crashes.
export default defineConfig(async ({ mode }) => {
  const srcUrl = new URL("./src", import.meta.url);
  let srcAlias = decodeURIComponent(srcUrl.pathname);

  try {
    const { fileURLToPath } = await import("node:url");
    srcAlias = fileURLToPath(srcUrl);
  } catch {
    // Deno (used by Lovable) doesn't expose Node's url helpers; fall back to the POSIX-style path.
    srcAlias = decodeURIComponent(srcUrl.pathname);
  }

  const plugins = [react()];

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn(
        "[vite] lovable-tagger unavailable, continuing without dev-only tagging support.",
        error
      );
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self' https://hysvqdwmhxnblxfqnszn.supabase.co wss://hysvqdwmhxnblxfqnszn.supabase.co https://api.tradeline247ai.com wss://api.tradeline247ai.com; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
      }
    },
    plugins,
    resolve: {
      alias: {
        "@": srcAlias,
      },
    },
    define: {
      // Prevent libs from exploding when they check process.env in Deno/browser
      "process.env": {},
    },
    build: {
      target: "es2020",
      sourcemap: mode === "development",
      rollupOptions: {
        output: {},
      },
    },
  };
});
