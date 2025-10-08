/**
 * Service Worker for AutoRepAi PWA
 * 
 * Implements offline-first caching strategy with compliance-aware behaviors
 * WCAG 2.2 AA: Ensures app remains accessible offline
 */

const CACHE_NAME = 'autorepaica-v6-20251008-canonical-headers';
const RUNTIME_CACHE = 'autorepaica-runtime-v6';

// Environment-aware security headers
// Production: frame-ancestors only self + canonical
// Preview: frame-ancestors includes Lovable domains
const IS_PRODUCTION = self.location.hostname === 'www.autorepai.ca' || 
                      self.location.hostname === 'autorepai.ca';
const CANONICAL = 'https://www.autorepai.ca';

function buildFrameAncestors() {
  const base = ["'self'", CANONICAL];
  
  if (IS_PRODUCTION) {
    return base.join(' '); // Production: strict allowlist
  }
  
  // Preview: include Lovable domains
  return [
    ...base,
    'https://lovable.app',
    'https://lovable.dev',
    'https://*.lovable.app',
    'https://*.lovable.dev',
    'https://*.lovableproject.com'
  ].join(' ');
}

function buildCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://va.vercel-scripts.com",
    `frame-ancestors ${buildFrameAncestors()}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

// Critical assets to cache on install - APP SHELL + FIRST PAINT
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Install event: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Security headers to apply to all responses
// DO NOT include X-Frame-Options - CSP frame-ancestors supersedes it per MDN guidance
// Environment-aware: Production restricts to canonical only, Preview allows Lovable domains
const SECURITY_HEADERS = {
  'Content-Security-Policy': buildCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Helper function to add security headers to response
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Fetch event: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/functions/') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache error responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return addSecurityHeaders(response);
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return addSecurityHeaders(cached);
            return addSecurityHeaders(new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              { headers: { 'Content-Type': 'application/json' } }
            ));
          });
        })
    );
    return;
  }

// Navigation requests (HTML): ALWAYS serve cached app shell for SPA routing
  // This ensures deep links work offline and when server lacks fallback config
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then((cachedShell) => {
          if (cachedShell) {
            // App shell found - serve it immediately for client-side routing
            return addSecurityHeaders(cachedShell);
          }
          // No cached shell - try network as fallback (initial load)
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put('/index.html', clone));
                return addSecurityHeaders(response);
              }
              return addSecurityHeaders(response);
            })
            .catch(() => {
              // Network failed and no cache - return offline page
              return addSecurityHeaders(new Response(
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>App Unavailable</h1><p>Please check your connection.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              ));
            });
        })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return addSecurityHeaders(cached);

      return fetch(request).then((response) => {
        // Don't cache opaque responses or errors
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return addSecurityHeaders(response);
        }

        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return addSecurityHeaders(response);
      });
    })
  );
});

// Background sync for offline form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  }
});

async function syncLeads() {
  // TODO: Implement offline lead sync when IndexedDB queue is added
  console.log('[SW] Background sync triggered for leads');
}
