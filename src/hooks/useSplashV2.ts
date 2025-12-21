/**
 * useSplashV2 Hook
 *
 * Provides splash v2 state and control for integration into the app boot flow.
 *
 * Usage:
 * ```tsx
 * const { showSplash, SplashComponent, onSplashComplete } = useSplashV2();
 *
 * return (
 *   <>
 *     {showSplash && <SplashComponent onComplete={onSplashComplete} />}
 *     {!showSplash && <App />}
 *   </>
 * );
 * ```
 *
 * @module hooks/useSplashV2
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { makeBootDecision, getBootState, type BootState } from '@/lib/boot';
import { SplashV2 } from '@/components/SplashV2';

export interface UseSplashV2Result {
  /** Whether splash should be shown */
  showSplash: boolean;
  /** The splash component to render */
  SplashComponent: typeof SplashV2;
  /** Callback to mark splash as complete */
  onSplashComplete: () => void;
  /** Current boot state */
  bootState: BootState | null;
  /** Whether app is ready to show main content */
  isReady: boolean;
}

/**
 * Hook to manage splash v2 state and lifecycle
 */
export function useSplashV2(): UseSplashV2Result {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Determine initial state synchronously to avoid flash
    const state = makeBootDecision();
    return state.decision.type !== 'SKIP_SPLASH';
  });

  const [bootState, setBootState] = useState<BootState | null>(() => getBootState());
  const [isReady, setIsReady] = useState<boolean>(() => {
    const state = getBootState();
    return state?.decision.type === 'SKIP_SPLASH';
  });

  // Ensure boot decision is made on mount
  useEffect(() => {
    const state = makeBootDecision();
    setBootState(state);

    // If skipping, mark ready immediately
    if (state.decision.type === 'SKIP_SPLASH') {
      setShowSplash(false);
      setIsReady(true);
    }
  }, []);

  const onSplashComplete = useCallback(() => {
    setShowSplash(false);
    setIsReady(true);
  }, []);

  return useMemo(
    () => ({
      showSplash,
      SplashComponent: SplashV2,
      onSplashComplete,
      bootState,
      isReady,
    }),
    [showSplash, onSplashComplete, bootState, isReady]
  );
}

export default useSplashV2;
