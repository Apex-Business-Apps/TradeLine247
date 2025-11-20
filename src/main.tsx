import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n/config';
import { telemetry } from './lib/observability/telemetry';
import App from './App';

console.info('🚀 TradeLine 24/7 - Starting main.tsx');
console.info('✅ Core modules loaded');

const loadStart = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - loadStart;
  telemetry.trackPerformance('page_load', loadTime);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

console.info('✅ React mounted successfully');
