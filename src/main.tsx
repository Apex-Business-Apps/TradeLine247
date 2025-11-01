import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

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
if (!root) { document.body.innerHTML = '<pre>Missing #root</pre>'; throw new Error('Missing #root'); }

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
  ReactDOM.createRoot(root!).render(
    React.createElement('pre', { style:{padding:'24px',whiteSpace:'pre-wrap'} }, `⚠️ ${title}\n${msg}${stack}`)
  );
}

window.addEventListener('error', (e) => { if (isPreview) diag('App error', e.error ?? e.message); });
window.addEventListener('unhandledrejection', (e) => { if (isPreview) diag('Unhandled rejection', e.reason); });

// CRITICAL: Synchronous render path for immediate FCP
// Use Promise.race with timeout to ensure React mounts quickly
async function boot() {
  try {
    // Create root immediately for faster initial render
    const reactRoot = ReactDOM.createRoot(root!);
    
    // CRITICAL: Timeout protection - if import takes >10s, show fallback (generous timeout for CI)
    const importPromise = import('./App');
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('App import timeout')), 10000)
    );
    
    try {
      const mod = await Promise.race([importPromise, timeoutPromise]);
      const App = (mod as any)?.default ?? (() => null);
      
      // CRITICAL: Render immediately - don't wait for anything else
      reactRoot.render(React.createElement(App));
      
      // Ensure root is visible (CSS might hide it initially)
      root!.style.opacity = '1';
      root!.style.visibility = 'visible';
      
    } catch (timeoutErr) {
      // Timeout occurred - render error fallback
      console.error('App import timeout or failed:', timeoutErr);
      reactRoot.render(
        React.createElement('div', {
          style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui'
          }
        }, '⚠️ Application loading...')
      );
      root!.style.opacity = '1';
      root!.style.visibility = 'visible';
      
      // Retry import in background
      import('./App').then(mod => {
        const App = (mod as any)?.default;
        if (App) {
          reactRoot.render(React.createElement(App));
        }
      }).catch(e => {
        console.error('Retry failed:', e);
      });
    }
  } catch (e) { 
    diag('App failed to start', e);
    // Ensure root is visible even on error
    root!.style.opacity = '1';
    root!.style.visibility = 'visible';
  }
}

// CRITICAL: Start boot immediately - don't defer
boot();
