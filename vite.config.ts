import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Environment-aware frame-ancestors configuration
// Production: only self + canonical. Preview: self + canonical + preview domains.
const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview';
const CANONICAL = 'https://www.autorepai.ca';

function buildFrameAncestors(): string[] {
  const base = ["'self'", CANONICAL];
  
  if (isProduction) {
    return base; // Production: strict, only self + canonical
  }
  
  // Preview/dev: include Lovable preview domains
  const previewDomains = [
    'https://lovable.app',
    'https://lovable.dev', 
    'https://*.lovable.app',
    'https://*.lovable.dev',
    'https://*.lovableproject.com'
  ];
  
  // Allow PREVIEW_ANCESTORS env var for additional domains (space-separated)
  const extraAncestors = (process.env.PREVIEW_ANCESTORS || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  
  return [...base, ...previewDomains, ...extraAncestors];
}

function buildCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://va.vercel-scripts.com",
    `frame-ancestors ${buildFrameAncestors().join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const securityHeaders = {
  // X-Frame-Options intentionally omitted - CSP frame-ancestors supersedes it
  'Content-Security-Policy': buildCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
  },
  preview: {
    port: 8080,
    headers: securityHeaders,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  esbuild: {
    // Remove console statements in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor splitting strategy for better caching and performance
          if (id.includes('node_modules')) {
            // React core (changes infrequently, cache-friendly)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // UI library (Radix UI - changes infrequently)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }

            // Chart library (heavy, used only in specific pages)
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }

            // PDF generation (very heavy, lazy load candidates)
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }

            // Supabase client (changes with backend updates)
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }

            // i18n (used app-wide but can be separate)
            if (id.includes('i18next')) {
              return 'i18n-vendor';
            }

            // TanStack Query (state management, changes infrequently)
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }

            // Other vendor code (catch-all)
            return 'vendor';
          }
        }
      }
    }
  },
}));
