/**
 * AppWithSplash - Root component that handles splash v2 before showing main app
 *
 * This component uses the BootCoordinator to determine whether to show
 * the SplashV2 experience before rendering the main App.
 *
 * The splash decision is made ONCE per session, and it's impossible for
 * both legacy splash and SplashV2 to run (enforced by BootCoordinator).
 *
 * @module components/AppWithSplash
 */

import React, { useState, useCallback, useEffect } from 'react';
import { makeBootDecision, getBootState } from '@/lib/boot';
import App from '@/App';

// Lazy load SplashV2 to avoid blocking initial bundle
const SplashV2 = React.lazy(() => import('@/components/SplashV2'));

/**
 * Root component that gates the app behind SplashV2 when appropriate
 */
export const AppWithSplash: React.FC = () => {
  // Determine splash state synchronously to prevent flash
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    const state = makeBootDecision();
    const shouldShow = state.decision.type !== 'SKIP_SPLASH';
    console.info('[AppWithSplash] Initial splash state:', shouldShow ? 'showing' : 'skipping');
    return shouldShow;
  });

  const [isReady, setIsReady] = useState<boolean>(() => {
    const state = getBootState();
    return state?.decision.type === 'SKIP_SPLASH';
  });

  const handleSplashComplete = useCallback(() => {
    console.info('[AppWithSplash] Splash complete, showing main app');
    setShowSplash(false);
    setIsReady(true);
  }, []);

  // Log boot state for debugging
  useEffect(() => {
    const state = getBootState();
    if (state) {
      console.info('[AppWithSplash] Boot state:', state.decision);
    }
  }, []);

  // If splash should show, render it with lazy loading
  if (showSplash) {
    return (
      <React.Suspense
        fallback={
          // Minimal fallback while SplashV2 loads (should be very brief)
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
              zIndex: 9999,
            }}
          />
        }
      >
        <SplashV2 onComplete={handleSplashComplete} />
      </React.Suspense>
    );
  }

  // Render main app when ready
  return <App />;
};

export default AppWithSplash;
