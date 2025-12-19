/**
 * ⚠️ DEPRECATED: StartupSplash (Legacy)
 *
 * Deprecated as of 2025-12-19
 * Replaced by: MagicHeartSplash v2 (src/components/splash/MagicHeartSplash.tsx)
 * Managed by: BootController (src/lib/BootController.ts)
 *
 * DO NOT REWIRE THIS COMPONENT
 * DO NOT IMPORT THIS COMPONENT
 *
 * Removal planned for: 2026-01-19 (30 days after deprecation)
 *
 * This component was never used in production (orphaned code).
 * It existed as a proof-of-concept but was never wired into the app.
 *
 * Splash v2 Architecture:
 * - Single source of truth: BootController
 * - No stacked/duplicate splashes
 * - Feature-flagged (off by default)
 * - Persistent (once per app version)
 *
 * @deprecated Use MagicHeartSplash v2 instead
 * @module components/StartupSplashLegacyDeprecated
 */

import React, { useEffect, useState } from "react";
import { errorReporter } from '@/lib/errorReporter';

export default function StartupSplashLegacyDeprecated() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // HARD GUARD: Prevent accidental use
    console.error('[DEPRECATED] StartupSplashLegacyDeprecated was called. This component is deprecated and should not be used.');
    console.error('[DEPRECATED] Use MagicHeartSplash v2 via SplashGate instead.');

    errorReporter.report({
      type: 'error',
      message: 'DEPRECATED: StartupSplashLegacyDeprecated was called (should not happen)',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment']()
    });

    // feature flag + one-time per session
    const disabled = import.meta.env.VITE_SPLASH_ENABLED === "false";
    const urlOff = new URLSearchParams(location.search).has("nosplash");
    const seen = sessionStorage.getItem("tl_splash_dismissed") === "1";
    if (disabled || urlOff || seen) return;

    // Safety: Ensure app is actually mounted before showing splash
    const checkMount = () => {
      const root = document.getElementById('root');
      const main = document.getElementById('main');
      if (root && (root.children.length > 0 || main)) {
        setShow(true);
        const t = setTimeout(() => dismiss(), 1000); // Reduced from 1800ms
        return () => clearTimeout(t);
      } else {
        // App not mounted yet, dismiss splash to prevent blocking
        errorReporter.report({
          type: 'error',
          message: 'App not mounted, dismissing splash',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment']()
        });
        dismiss();
      }
    };

    // Delay check to ensure React has mounted
    const checkTimer = setTimeout(checkMount, 100);
    return () => clearTimeout(checkTimer);
  }, []);

  function dismiss() {
    sessionStorage.setItem("tl_splash_dismissed","1");
    setShow(false);
  }

  // Emergency unblanking: If shown for >2s, auto-dismiss
  useEffect(() => {
    if (show) {
      const emergency = setTimeout(() => {
        errorReporter.report({
          type: 'error',
          message: 'Startup splash auto-dismissed (emergency timeout)',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment']()
        });
        dismiss();
      }, 2000);
      return () => clearTimeout(emergency);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div role="dialog" aria-label="Welcome to TradeLine 24/7" aria-modal="true"
         className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card/95 border border-border rounded-3xl p-7 max-w-2xl w-full mx-4 text-center animate-scale-in"
           style={{
             boxShadow: 'var(--premium-shadow-strong)',
             background: 'linear-gradient(135deg, hsl(var(--card) / 0.98) 0%, hsl(var(--card) / 0.95) 100%)'
           }}
           role="document"
           onClick={dismiss}>
        <img
          className="w-64 h-auto mx-auto mb-3 block animate-scale-in hover-scale transition-transform duration-300"
          src="/assets/brand/TRADELEINE_ROBOT_V2.svg"
          alt="TradeLine 24/7 logo"
          loading="eager"
          fetchpriority="high"
        />
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground bg-gradient-to-r from-brand-orange-primary to-brand-orange-light  text-foreground">
          Your 24/7 AI Receptionist!
        </h1>
        <p className="text-lg text-muted-foreground mb-3 leading-relaxed">
          Never miss a call. Work while you sleep.
        </p>
        <small className="text-sm text-muted-foreground/80 tracking-wide">
          TradeLine 24/7 • Built with Canadian Excellence
        </small>
      </div>

      <style>{`
        /* Respect reduced motion: no animations for users who prefer less motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-scale-in,
          .hover-scale {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          .backdrop-blur-sm {
            backdrop-filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
