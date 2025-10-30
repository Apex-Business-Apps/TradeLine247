import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const root = document.getElementById('root');
if (!root) { document.body.innerHTML = '<pre>Missing #root</pre>'; throw new Error('Missing #root'); }

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

async function boot() {
  try {
    const mod = await import('./App');               // dynamic import catches top-level throws
    const App = (mod as any)?.default ?? (() => null);
    ReactDOM.createRoot(root!).render(React.createElement(App));
  } catch (e) { diag('App failed to start', e); }
}
boot();
