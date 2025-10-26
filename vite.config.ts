import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// IMPORTANT: do not import 'fs', 'path', or other Node libs in code that runs in the browser.
// This config remains Node-only, but we neutralize 'process.env' for browser bundles to avoid crashes.
export default defineConfig(async ({ mode }) => {
  const srcUrl = new URL("./src", import.meta.url);
  let srcAlias: string;

  try {
    const { fileURLToPath } = await import("node:url");
    try {
      srcAlias = fileURLToPath(srcUrl);
    } catch {
      // Node can throw ERR_INVALID_FILE_URL_PATH when the URL contains encodings it does not expect (observed on
      // macOS runners when the checkout lives in a randomized /private path). Fall back to a manual decode so
      // the build proceeds instead of exploding inside `npx cap sync`.
      srcAlias = decodeURIComponent(srcUrl.pathname);
    }
  } catch {
    // Deno (used by Lovable) doesn't expose Node's url helpers; fall back to the decoded pathname.
    srcAlias = decodeURIComponent(srcUrl.pathname);
  }

  // When running on Windows via Node the decoded pathname can look like /C:/path — trim the leading slash
  // so Vite receives a native path. Deno does not expose process.platform, so guard our inspection.
  if (/^\/[A-Za-z]:/.test(srcAlias)) {
    srcAlias = srcAlias.slice(1);
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
        'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self' https://hysvqdwmhxnblxfqnszn.supabase.co wss://hysvqdwmhxnblxfqnszn.supabase.co https://api.tradeline247ai.com wss://api.tradeline247ai.com https://www.google-analytics.com https://www.googletagmanager.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
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
