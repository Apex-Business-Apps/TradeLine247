/**
 * Safe Mode utilities.
 *
 * CONTRACT: E2E tests rely on:
 * - detectSafeModeFromSearch(search) returning true for ?safe=1
 * - console.info('[SAFE MODE] Enabled via ?safe=1')
 * - document.body.dataset.safeMode === 'true'
 * Do not change these without updating the E2E specs and related docs.
 */

export const SAFE_MODE_LOG = '[SAFE MODE] Enabled via ?safe=1';

export function detectSafeModeFromSearch(search: string): boolean {
  if (!search) return false;

  try {
    const params = new URLSearchParams(search);
    return params.get('safe') === '1';
  } catch {
    return false;
  }
}

export function enableSafeModeSideEffects(): void {
  if (typeof document === 'undefined') return;

  const body = document.body;
  if (!body) return;

  if (body.dataset.safeMode === 'true') {
    return;
  }

  body.dataset.safeMode = 'true';
  document.documentElement?.setAttribute('data-safe', '1');

  if (typeof window !== 'undefined') {
    (window as any).__SAFE_MODE__ = true;
  }

  console.info(SAFE_MODE_LOG);

  const root = document.getElementById('root');
  if (root) {
    root.style.opacity = '1';
    root.style.visibility = 'visible';
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {
          /* ignore */
        });
      });
    });
  }
}

