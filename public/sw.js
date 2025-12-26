// Service Worker v7 - SELF-DESTROYING mode to clear stale caches and recover from blank page
// This version immediately unregisters itself and clears ALL caches
// This is a ONE-TIME recovery deployment to fix the React createContext error
// After users get this version, revert to normal SW in next deployment
const SW_VERSION = '7-SELF-DESTRUCT';
const SELF_DESTRUCT_MODE = true; // Set to false in next deployment to restore normal PWA

self.addEventListener("install", (event) => {
  console.warn(`[SW ${SW_VERSION}] 🧨 SELF-DESTRUCT MODE - Installing to clear all caches...`);
  event.waitUntil(
    // Delete ALL caches immediately
    caches.keys().then((cacheNames) => {
      console.warn(`[SW ${SW_VERSION}] 🧨 Destroying ${cacheNames.length} caches...`);
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.warn(`[SW ${SW_VERSION}] 🧨 Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.warn(`[SW ${SW_VERSION}] 🧨 All caches destroyed. Skipping waiting...`);
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.warn(`[SW ${SW_VERSION}] 🧨 Activating SELF-DESTRUCT sequence...`);
  event.waitUntil(
    // Claim all clients immediately
    self.clients.claim().then(() => {
      console.warn(`[SW ${SW_VERSION}] 🧨 Claimed clients. Initiating unregister...`);
      // Notify all clients that caches are cleared
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_SELF_DESTRUCT',
          version: SW_VERSION,
          message: 'All caches cleared. Service worker unregistering. Please reload page.'
        });
      });
      console.warn(`[SW ${SW_VERSION}] 🧨 Notified ${clients.length} clients`);

      // Unregister this service worker
      return self.registration.unregister();
    }).then((unregistered) => {
      if (unregistered) {
        console.warn(`[SW ${SW_VERSION}] 🧨 SELF-DESTRUCT COMPLETE - Service worker unregistered successfully`);
      } else {
        console.error(`[SW ${SW_VERSION}] ⚠️  Failed to unregister service worker`);
      }
    }).catch((error) => {
      console.error(`[SW ${SW_VERSION}] ⚠️  Self-destruct error:`, error);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // SELF-DESTRUCT MODE: Pass all requests directly to network, no caching
  // This ensures users get fresh content immediately after cache wipe
  if (SELF_DESTRUCT_MODE) {
    console.warn(`[SW ${SW_VERSION}] 🧨 SELF-DESTRUCT: Bypassing cache for ${event.request.url}`);
    event.respondWith(fetch(event.request));
    return;
  }

  // Normal SW behavior would go here (but we're in self-destruct mode)
});
