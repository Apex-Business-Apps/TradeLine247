/**
 * Deep Links Hook for Capacitor Native Apps
 *
 * Handles both warm start (app already running) and cold start (app launched via deep link)
 * deep link navigation. Uses the tradeline247:// URL scheme.
 *
 * @module hooks/useDeepLinks
 */

import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to handle deep link navigation in native apps.
 * Automatically navigates to the path specified in the deep link URL.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useDeepLinks();
 *   return <Routes>...</Routes>;
 * }
 * ```
 *
 * Supported URLs:
 * - tradeline247://dashboard -> /dashboard
 * - tradeline247://calls/missed -> /calls/missed
 * - tradeline247://settings?tab=voice -> /settings?tab=voice
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // No-op on web
    }

    let mounted = true;

    /**
     * Handle warm start deep links (app already running)
     */
    const handleUrlOpen = (event: URLOpenListenerEvent) => {
      if (!mounted) return;

      try {
        const url = new URL(event.url);
        const path = url.pathname + url.search;
        console.info('[DeepLinks] Warm start navigation:', path);
        navigate(path);
      } catch (error) {
        console.error('[DeepLinks] Failed to parse URL:', error);
      }
    };

    // Register listener for warm start
    App.addListener('appUrlOpen', handleUrlOpen);

    /**
     * Handle cold start deep links (app launched via deep link)
     */
    App.getLaunchUrl()
      .then((result) => {
        if (result?.url && mounted) {
          try {
            const url = new URL(result.url);
            const path = url.pathname + url.search;
            console.info('[DeepLinks] Cold start navigation:', path);
            navigate(path);
          } catch (error) {
            console.error('[DeepLinks] Failed to parse launch URL:', error);
          }
        }
      })
      .catch((error) => {
        console.error('[DeepLinks] Failed to get launch URL:', error);
      });

    // Cleanup on unmount
    return () => {
      mounted = false;
      App.removeAllListeners();
    };
  }, [navigate]);
}

export default useDeepLinks;
