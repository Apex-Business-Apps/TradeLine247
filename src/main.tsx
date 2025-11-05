// ===================================================================
// SIMPLIFIED MOUNTING - Traditional approach with error handling
// ===================================================================
import { logger } from './lib/logger';

logger.debug('🚀 TradeLine 24/7 - Starting main.tsx...');

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SafeErrorBoundary from "./components/errors/SafeErrorBoundary";
import "./index.css";
import { initBootSentinel } from "./lib/bootSentinel";
import { runSwCleanup } from "./lib/swCleanup";
import { featureFlags } from "./config/featureFlags";
import "./i18n/config";

logger.debug('✅ Core modules loaded');

// H310-1: Dev-only error listener to capture React Error #310
if (import.meta.env.DEV && featureFlags.H310_HARDENING) {
  window.addEventListener('error', (e) => {
    const msg = String(e?.error?.message || '');
    if (msg.includes('Rendered more hooks') || msg.includes('rendered more hooks')) {
      console.info('🚨 H310_CAPTURE - React Hook Order Violation Detected:', {
        message: msg,
        stack: e.error?.stack || e.message,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    }
  });
  logger.debug('🛡️ H310 Hardening: Error listener active');
}

// Initialize error observability for production
if (import.meta.env.PROD) {
  import('./utils/errorObservability').then(({ initErrorObservability }) => {
    initErrorObservability();
  });
}

// ENHANCED: Initialize Lovable GitHub connection health monitoring
// This helps diagnose and prevent GitHub reconnection issues
if (import.meta.env.DEV || /lovable/.test(location.hostname)) {
  import('./lib/lovableGitHubMonitor').then(({ initializeGitHubHealthMonitor }) => {
    initializeGitHubHealthMonitor();
  }).catch(() => {
    // Fallback if monitor not available (may not exist in all repos)
    console.warn('⚠️ Lovable GitHub monitor not available');
  });
}

// ENHANCED: Initialize Lovable save/publish failsafe system
// Comprehensive failsafe for save/publish operations with automatic retry
if (import.meta.env.DEV || /lovable/.test(location.hostname)) {
  import('./lib/lovableSaveFailsafe')
    .then(({ initializeLovableFailsafe }) => {
      initializeLovableFailsafe({
        maxRetries: 5,
        retryDelayMs: 1000,
        maxRetryDelayMs: 30000,
        queueSize: 50,
        batchIntervalMs: 5000,
        healthCheckIntervalMs: 30000,
        enableFallback: true,
      });
      logger.debug('✅ Lovable save failsafe initialized');
    })
    .catch((error) => {
      console.warn('⚠️ Lovable save failsafe not available:', error);
    });
}

// Unregister any existing service workers to prevent stale cache issues
// Will re-enable PWA with proper update strategy after stabilization
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.info('[SW] Service worker unregistered - preventing stale cache during stabilization');
      });
    }
  });
}

const root = document.getElementById('root');
if (!root) { 
  // Secure DOM manipulation - use textContent instead of innerHTML
  const errorMsg = document.createElement('pre');
  errorMsg.textContent = 'Missing #root';
  document.body.appendChild(errorMsg); 
  throw new Error('Missing #root'); 
}

// CRITICAL: Hide loading fallback immediately when this script executes (non-blocking, safe)
const loadingEl = document.getElementById('root-loading');
if (loadingEl) {
  // Use requestAnimationFrame to ensure DOM is ready, but execute immediately
  requestAnimationFrame(() => {
    if (loadingEl) loadingEl.style.display = 'none';
  });
}

const isPreview = import.meta.env.DEV || /lovable/.test(location.hostname);

function diag(title: string, err: unknown) {
  if (!isPreview) throw err;
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? `\n\n${err.stack}` : '';
  logger.error('[PreviewDiag]', err, { title });
  createRoot(root!).render(
    React.createElement('pre', { style:{padding:'24px',whiteSpace:'pre-wrap'} }, `⚠️ ${title}\n${msg}${stack}`)
  );
}

window.addEventListener('error', (e) => { if (isPreview) diag('App error', e.error ?? e.message); });
window.addEventListener('unhandledrejection', (e) => { if (isPreview) diag('Unhandled rejection', e.reason); });

// CRITICAL: Synchronous render path for immediate FCP
// Use App already imported at top for fastest possible mount
function boot() {
  try {
    // Create root immediately for faster initial render
    const reactRoot = createRoot(root!);
    
    // CRITICAL: Render immediately using already-imported App - no async delay
    // Wrap with Error Boundary to catch mount failures
    reactRoot.render(
      React.createElement(SafeErrorBoundary, null,
        React.createElement(App)
      )
    );
    
    // Ensure root is visible (CSS might hide it initially)
    root!.style.opacity = '1';
    root!.style.visibility = 'visible';
    
    // Hide loading fallback immediately
    const loadingEl = document.getElementById('root-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    logger.debug('✅ React mounted successfully');
    
    // Run SW cleanup hotfix (one-time, auto-expires after 7 days)
    runSwCleanup().catch(err => console.warn('[SW Cleanup] Failed:', err));
    
    // Initialize boot sentinel (production monitoring only)
    initBootSentinel();
    
    // Load optional features after mount (non-blocking)
    setTimeout(() => {
      import("./styles/roi-table.css").catch(e => console.warn('⚠️ ROI table CSS failed:', e));
      import("./styles/header-align.css").catch(e => console.warn('⚠️ Header align CSS failed:', e));
      
      // Check for safe mode
      const urlParams = new URLSearchParams(window.location.search);
      const isSafeMode = urlParams.get('safe') === '1';
      
      if (!isSafeMode) {
        import("./lib/roiTableFix")
          .then(m => m.watchRoiTableCanon())
          .catch(e => console.warn('⚠️ ROI watcher failed:', e));
        
        import("./lib/pwaInstall")
          .then(m => m.initPWAInstall())
          .catch(e => console.warn('⚠️ PWA install failed:', e));
        
        window.addEventListener('load', () => {
          setTimeout(() => {
            import("./lib/heroGuardian")
              .then(m => m.initHeroGuardian())
              .catch(e => console.warn('⚠️ Hero guardian failed:', e));
          }, 1500);
        });
      } else {
        logger.debug('🛡️ Safe Mode: Optional features disabled');
      }
    }, 100);
    
  } catch (e) { 
    diag('App failed to start', e);
    // Ensure root is visible even on error
    root!.style.opacity = '1';
    root!.style.visibility = 'visible';
    
    // Hide loading fallback on error too
    const loadingEl = document.getElementById('root-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }
}

// CRITICAL: Start boot immediately - don't defer
boot();
