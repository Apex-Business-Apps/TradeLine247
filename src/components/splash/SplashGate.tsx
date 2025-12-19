/**
 * SplashGate - Integration Wrapper for Boot Controller + Splash v2
 *
 * This component:
 * 1. Queries BootController for the boot decision
 * 2. Shows MagicHeartSplash v2 if needed
 * 3. Renders children (main app) when splash completes
 *
 * CRITICAL: This is the ONLY place where splash is shown.
 * No other component should render splash screens.
 *
 * @module components/splash/SplashGate
 */

import React, { useEffect, useState } from 'react';
import { bootController, type BootDecision } from '@/lib/BootController';
import { MagicHeartSplash } from './MagicHeartSplash';

interface SplashGateProps {
  children: React.ReactNode;
}

export const SplashGate: React.FC<SplashGateProps> = ({ children }) => {
  const [bootDecision, setBootDecision] = useState<BootDecision | null>(null);
  const [showApp, setShowApp] = useState(false);

  // Query BootController on mount
  useEffect(() => {
    bootController.getBootDecision().then((decision) => {
      setBootDecision(decision);

      // If skipping splash, show app immediately
      if (decision === 'SKIP_SPLASH') {
        setShowApp(true);
      }
    });
  }, []);

  // Handle splash completion
  const handleSplashComplete = () => {
    setShowApp(true);
  };

  // Loading state (while BootController decides)
  if (bootDecision === null) {
    return null; // Or a minimal loader
  }

  // Skip splash mode: show app immediately
  if (bootDecision === 'SKIP_SPLASH') {
    return <>{children}</>;
  }

  // Show splash (full or quick fade)
  if (!showApp) {
    return (
      <MagicHeartSplash
        onComplete={handleSplashComplete}
        quickFade={bootDecision === 'QUICK_FADE'}
      />
    );
  }

  // Splash completed: show main app
  return <>{children}</>;
};

export default SplashGate;
