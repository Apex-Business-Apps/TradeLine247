import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n/config';
import { telemetry } from './lib/observability/telemetry';

const App = lazy(() => import('./App'));

const loadStart = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - loadStart;
  telemetry.trackPerformance('page_load', loadTime);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <App />
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
