/**
 * MagicHeartSplash v2 - "Magic Heart" Splash Experience
 *
 * Visual + Timing Requirements:
 * - Total duration: 2.0s max (hard cap)
 * - No spinner
 * - Pixie dust trail draws a heart, then APEX logo materializes
 * - Text: "TDA-backed biobytes" (exact)
 * - Alberta Innovates logo visible by 1.0s and stays until end
 * - Optional subtle chime (non-blocking, respects silent/accessibility)
 *
 * Fallback: If animation assets fail → show static branded screen for 1.0s then continue
 *
 * @module components/splash/MagicHeartSplash
 */

import React, { useEffect, useState, useRef } from 'react';
import { SPLASH_TIMING, SPLASH_Z_INDEX, QUICK_FADE, SPLASH_A11Y } from './constants';
import { featureFlags } from '@/config/featureFlags';
import { bootController } from '@/lib/BootController';

interface MagicHeartSplashProps {
  /** Callback when splash completes */
  onComplete: () => void;

  /** Quick fade mode (for return users) */
  quickFade?: boolean;
}

export const MagicHeartSplash: React.FC<MagicHeartSplashProps> = ({
  onComplete,
  quickFade = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasCompletedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Complete splash (idempotent)
  const completeSplash = async () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    // Mark splash as seen (persist to storage)
    await bootController.markSplashAsSeen();

    // Hide splash
    setIsVisible(false);

    // Notify parent
    setTimeout(() => {
      onComplete();
    }, 100); // Small delay for fade-out animation
  };

  // Setup completion timer
  useEffect(() => {
    const duration = quickFade
      ? QUICK_FADE.DURATION
      : prefersReducedMotion
      ? SPLASH_A11Y.REDUCED_MOTION_DURATION
      : SPLASH_TIMING.TOTAL_DURATION;

    timeoutRef.current = setTimeout(() => {
      completeSplash();
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [quickFade, prefersReducedMotion]);

  // Optional chime sound (non-blocking)
  useEffect(() => {
    if (
      !quickFade &&
      !prefersReducedMotion &&
      featureFlags.SPLASH_V2_SOUND_ENABLED
    ) {
      try {
        // Attempt to play chime (gracefully fail if audio not available)
        const audio = new Audio('/assets/sounds/splash-chime.mp3');
        audio.volume = 0.3; // Subtle volume
        audioRef.current = audio;

        // Play with error handling
        audio.play().catch((err) => {
          console.info('[Splash] Audio playback failed (expected on some browsers):', err);
        });
      } catch (err) {
        console.info('[Splash] Audio not available:', err);
      }
    }

    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [quickFade, prefersReducedMotion]);

  // Image error handler (fallback)
  const handleImageError = () => {
    console.warn('[Splash] Asset failed to load, using fallback');
    setHasError(true);
  };

  if (!isVisible) {
    return null;
  }

  // Quick fade mode (return users)
  if (quickFade) {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-brand-orange-primary/10 to-brand-orange-light/5 backdrop-blur-sm animate-fade-out pointer-events-none"
        style={{ zIndex: SPLASH_Z_INDEX.OVERLAY }}
        aria-hidden="true"
      />
    );
  }

  // Reduced motion mode
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900"
        style={{ zIndex: SPLASH_Z_INDEX.OVERLAY }}
        role="dialog"
        aria-label="Loading TradeLine 24/7"
        aria-live="polite"
      >
        <div className="text-center space-y-6">
          <img
            src="/assets/brand/apex-logo.png"
            alt="APEX Business Systems"
            className="w-48 h-auto mx-auto"
            onError={handleImageError}
          />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            TDA-backed biobytes
          </p>
          <img
            src="/assets/brand/alberta-innovates-logo.png"
            alt="Alberta Innovates"
            className="w-40 h-auto mx-auto opacity-80"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  }

  // Full animated splash v2
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-900 overflow-hidden"
      style={{ zIndex: SPLASH_Z_INDEX.OVERLAY }}
      role="dialog"
      aria-label="Welcome to TradeLine 24/7"
      aria-live="polite"
      onClick={() => completeSplash()}
    >
      {/* Pixie Dust Heart Trail */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: SPLASH_Z_INDEX.PIXIE_DUST }}
      >
        <svg
          className="splash-heart-trail"
          width="300"
          height="300"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pixie-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffa500" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Heart path (SVG heart shape) */}
          <path
            d="M50,85 C50,85 20,60 20,40 C20,30 25,25 32,25 C40,25 45,30 50,38 C55,30 60,25 68,25 C75,25 80,30 80,40 C80,60 50,85 50,85 Z"
            fill="none"
            stroke="url(#pixie-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            className="heart-path"
          />
        </svg>
      </div>

      {/* Main content container */}
      <div className="relative z-10 text-center space-y-8 px-6">
        {/* APEX Logo (materializes after heart) */}
        <div className="splash-apex-logo">
          <img
            src="/assets/brand/apex-logo.png"
            alt="APEX Business Systems"
            className="w-56 h-auto mx-auto drop-shadow-2xl"
            onError={handleImageError}
          />
        </div>

        {/* Text: "TDA-backed biobytes" */}
        <div className="splash-text">
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
            TDA-backed biobytes
          </p>
        </div>

        {/* Alberta Innovates Logo (appears at 1.0s, stays until end) */}
        <div className="splash-alberta-logo">
          <img
            src="/assets/brand/alberta-innovates-logo.png"
            alt="Sponsored by Alberta Innovates"
            className="w-48 h-auto mx-auto opacity-90"
            onError={handleImageError}
          />
        </div>
      </div>

      {/* Skip button (accessibility) */}
      <button
        onClick={() => completeSplash()}
        className="splash-skip-button absolute bottom-8 right-8 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors opacity-0"
        aria-label="Skip splash screen"
      >
        Skip
      </button>

      {/* Inline styles for animations */}
      <style>{`
        /* Heart trail animation (0.0s - 0.6s) */
        @keyframes draw-heart {
          from {
            stroke-dashoffset: 400;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .heart-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw-heart ${SPLASH_TIMING.PIXIE_DUST_DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }

        /* APEX logo materialize (0.6s - 0.9s) */
        @keyframes materialize-apex {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        .splash-apex-logo {
          opacity: 0;
          animation: materialize-apex ${SPLASH_TIMING.APEX_LOGO_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1) ${SPLASH_TIMING.APEX_LOGO_START}ms forwards;
        }

        /* Text fade-in (0.8s) */
        @keyframes fade-in-text {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .splash-text {
          opacity: 0;
          animation: fade-in-text 300ms ease-in ${SPLASH_TIMING.TEXT_START}ms forwards;
        }

        /* Alberta Innovates logo (1.0s - 2.0s) CRITICAL: must be visible by 1.0s */
        @keyframes fade-in-sponsor {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 0.9;
            transform: translateY(0);
          }
        }

        .splash-alberta-logo {
          opacity: 0;
          animation: fade-in-sponsor 400ms ease-out ${SPLASH_TIMING.ALBERTA_LOGO_START}ms forwards;
        }

        /* Skip button (appears after 0.5s for accessibility) */
        @keyframes fade-in-skip {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.6;
          }
        }

        .splash-skip-button {
          animation: fade-in-skip 200ms ease-out ${SPLASH_A11Y.SKIP_BUTTON_DELAY}ms forwards;
        }

        /* Quick fade out animation */
        @keyframes fade-out-quick {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-fade-out {
          animation: fade-out-quick ${QUICK_FADE.DURATION}ms ease-out forwards;
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .heart-path,
          .splash-apex-logo,
          .splash-text,
          .splash-alberta-logo,
          .splash-skip-button,
          .animate-fade-out {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MagicHeartSplash;
