import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Remove X-Frame-Options to allow embedding in Lovable preview iframe
      'X-Frame-Options': undefined as any,
      // Strong CSP with allowed frame-ancestors for Lovable domains
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://api.lovable.app",
        "frame-ancestors 'self' https://lovable.app https://lovable.dev https://*.lovable.app https://*.lovable.dev https://*.lovableproject.com",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
