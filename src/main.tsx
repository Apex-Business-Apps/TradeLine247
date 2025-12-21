// ===================================================================
// SIMPLIFIED MOUNTING - Traditional approach with error handling
// ===================================================================
// CRITICAL: Use console.info instead of console.log to survive production minification
console.info('🚀 TradeLine 24/7 - Starting main.tsx...');

import React from "react";
import { createRoot } from "react-dom/client";
import "./safe-mode";
// SPLASH V2: AppWithSplash handles splash screen decision via BootCoordinator
// The boot coordinator is the single source of truth for splash decisions
import AppWithSplash from "./components/AppWithSplash";
import SafeErrorBoundary from "./components/errors/SafeErrorBoundary";
import "./index.css";
import { initBootSentinel } from "./lib/bootSentinel";
import { runSwCleanup } from "./lib/swCleanup";
import { featureFlags } from "./config/featureFlags";
import "./i18n/config";
import { detectSafeModeFromSearch } from "./lib/safeMode";
import { initBackgroundSystem } from "./utils/backgroundSystem";

console.info('✅ Core modules loaded');

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
  console.info('🛡️ H310 Hardening: Error listener active');
}

// Initialize error observability for production
if (import.meta.env.PROD) {
  import('./utils/errorObservability').then(({ initErrorObservability }) => {
    initErrorObservability();
  }).catch((error) => {
    console.error('⚠️ Error observability initialization failed:', error);
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
      console.info('✅ Lovable save failsafe initialized');
    })
    .catch((error) => {
      console.warn('⚠️ Lovable save failsafe not available:', error);
    });
}

// PWA Service Worker Management:
// - Registration handled in index.html (production only)
// - Safe mode available via ?safe=1 query parameter
// - Version-based cache invalidation in sw.js prevents stale assets
// - One-time cleanup hotfix runs via swCleanup.ts (auto-expires after 7 days)

const root = document.getElementById('root');
if (!root) {
  // Safe DOM manipulation instead of innerHTML
  const errorPre = document.createElement('pre');
  errorPre.textContent = 'Missing #root';
  document.body.appendChild(errorPre);
  throw new Error('Missing #root');
}

const safeModeActive = detectSafeModeFromSearch(window.location.search);

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
  console.error('[PreviewDiag]', title, err);
  createRoot(root!).render(
    React.createElement('pre', { style:{padding:'24px',whiteSpace:'pre-wrap'} }, `⚠️ ${title}\n${msg}${stack}`)
  );
}

window.addEventListener('error', (e) => { if (isPreview) diag('App error', e.error ?? e.message); });
window.addEventListener('unhandledrejection', (e) => { if (isPreview) diag('Unhandled rejection', e.reason); });

// CRITICAL: Synchronous render path for immediate FCP
// AppWithSplash handles splash v2 gating via BootCoordinator (single source of truth)
function boot() {
  try {
    // Create root immediately for faster initial render
    const reactRoot = createRoot(root!);

    // CRITICAL: Render immediately using AppWithSplash
    // Splash v2 decision is made synchronously by BootCoordinator
    // When SPLASH_V2_ENABLED=false (default), splash is skipped entirely
    reactRoot.render(
      React.createElement(SafeErrorBoundary, null,
        React.createElement(AppWithSplash)
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

    console.info('✅ React mounted successfully');

    // Initialize background system (viewport height fix, platform detection)
    initBackgroundSystem();

    // Signal to E2E tests that React hydration is complete
    setTimeout(() => {
      (window as any).__REACT_READY__ = true;
    }, 0);

    // Run SW cleanup hotfix (one-time, auto-expires after 7 days)
    runSwCleanup().catch(err => console.warn('[SW Cleanup] Failed:', err));

    // Initialize boot sentinel (production monitoring only)
    initBootSentinel();
    
    // Load optional features after mount (non-blocking)
    setTimeout(() => {
      import("./styles/roi-table.css").catch(e => console.warn('⚠️ ROI table CSS failed:', e));
      // CRITICAL FIX: header-align.css must load synchronously to prevent layout shifts
      // Moved to index.css import for synchronous loading
      
      // Check for safe mode
      if (!safeModeActive) {
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
        console.info('🛡️ Safe Mode: Optional features disabled');
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
