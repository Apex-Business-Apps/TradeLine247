/**
 * Service Worker for AutoRepAi PWA
 * 
 * Implements offline-first caching strategy with compliance-aware behaviors
 * WCAG 2.2 AA: Ensures app remains accessible offline
 */

const CACHE_NAME = 'autorepaica-v4-20251005-embed-fix';
const RUNTIME_CACHE = 'autorepaica-runtime-v4';

// Critical assets to cache on install
const PRECACHE_ASSETS = [
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
// NOTE: X-Frame-Options removed - CSP frame-ancestors provides superior control
// frame-ancestors allows embedding in Lovable preview while blocking other origins
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://api.lovable.app; frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; base-uri 'self'; form-action 'self';"
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

// Navigation requests (HTML): network-first to avoid stale builds
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => addSecurityHeaders(response))
        .catch(() => caches.match(request).then(cached => cached ? addSecurityHeaders(cached) : cached))
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
