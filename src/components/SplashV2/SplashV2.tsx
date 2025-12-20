/**
 * Splash V2 - "Magic Heart" Experience
 *
 * A branded splash screen with pixie dust trail drawing a heart,
 * APEX logo materialization, and Alberta Innovates sponsorship.
 *
 * Timing (all timings are hard-coded constants):
 * - t=0.00: Background shown
 * - t=0.00–0.60: Pixie dust draws heart
 * - t=0.60–0.90: APEX logo materializes
 * - t=0.80: Show text "TDA-backed biobytes"
 * - t<=1.00: Alberta Innovates logo appears and remains until t=2.00
 * - t=2.00: Transition out (no jank)
 *
 * Fallback: If animation assets fail, show static branded screen for 1.0s
 *
 * @module components/SplashV2
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  makeBootDecision,
  onSplashV2Complete,
  TIMING,
  SPLASH_TOTAL_DURATION_MS,
  QUICK_FADE_DURATION_MS,
  shouldPlaySplashSound,
  type BootState,
} from '@/lib/boot';
import './SplashV2.css';

// Asset paths
const APEX_LOGO_PATH = '/assets/brand/apex-logo.png';
const ALBERTA_INNOVATES_LOGO_PATH = '/assets/logos/alberta-innovates.png';
const SPLASH_CHIME_PATH = '/assets/audio/splash-chime.mp3';

// Fallback timeout if assets fail
const FALLBACK_DURATION_MS = 1000;

interface SplashV2Props {
  /** Callback when splash is complete */
  onComplete?: () => void;
}

/**
 * Generate pixie dust particle positions along a heart path
 */
function generateHeartParticles(count: number): Array<{ x: number; y: number; delay: number }> {
  const particles: Array<{ x: number; y: number; delay: number }> = [];
  for (let i = 0; i < count; i++) {
    // Parametric heart curve
    const t = (i / count) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    // Normalize to container
    const normalizedX = 100 + x * 5;
    const normalizedY = 85 + y * 5;

    particles.push({
      x: normalizedX,
      y: normalizedY,
      delay: (i / count) * TIMING.PIXIE_DUST_END,
    });
  }
  return particles;
}

/**
 * Heart SVG path for the drawing animation
 */
const HeartPath = memo(function HeartPath() {
  return (
    <svg
      className="splash-v2-heart-svg"
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="50%" stopColor="#ff8c5a" />
          <stop offset="100%" stopColor="#ffb347" />
        </linearGradient>
      </defs>
      <path
        className="splash-v2-heart-path"
        d="M100,170 C65,140 10,100 10,60 C10,20 50,10 100,50 C150,10 190,20 190,60 C190,100 135,140 100,170 Z"
      />
    </svg>
  );
});

/**
 * Pixie dust particles component
 */
const PixieDust = memo(function PixieDust() {
  const particles = generateHeartParticles(30);

  return (
    <>
      {particles.map((particle, index) => (
        <div
          key={index}
          className="splash-v2-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}
    </>
  );
});

/**
 * Main Splash V2 Component
 */
export const SplashV2: React.FC<SplashV2Props> = ({ onComplete }) => {
  const [bootState, setBootState] = useState<BootState | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [hasAssetError, setHasAssetError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completedRef = useRef(false);

  // Initialize boot decision on mount
  useEffect(() => {
    const state = makeBootDecision();
    setBootState(state);

    // If skipping splash, complete immediately
    if (state.decision.type === 'SKIP_SPLASH') {
      onComplete?.();
      return;
    }

    // Pre-load audio if needed
    if (shouldPlaySplashSound()) {
      try {
        audioRef.current = new Audio(SPLASH_CHIME_PATH);
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'auto';
      } catch {
        // Audio not available - continue silently
      }
    }
  }, [onComplete]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Mark as seen if full splash was shown
    if (bootState?.decision.type === 'SHOW_V2_FULL') {
      onSplashV2Complete();
    }

    setIsExiting(true);

    // Wait for exit transition before calling onComplete
    setTimeout(() => {
      onComplete?.();
    }, 250);
  }, [bootState, onComplete]);

  // Main timing effect
  useEffect(() => {
    if (!bootState) return;

    const { decision } = bootState;

    // Already handled SKIP_SPLASH in initial effect
    if (decision.type === 'SKIP_SPLASH') return;

    let duration: number;

    switch (decision.type) {
      case 'SHOW_V2_FULL':
        duration = hasAssetError ? FALLBACK_DURATION_MS : SPLASH_TOTAL_DURATION_MS;
        break;
      case 'SHOW_V2_QUICK_FADE':
        duration = QUICK_FADE_DURATION_MS;
        break;
      case 'FALLBACK_STATIC':
        duration = FALLBACK_DURATION_MS;
        break;
      default:
        duration = SPLASH_TOTAL_DURATION_MS;
    }

    // Play sound if appropriate
    if (decision.type === 'SHOW_V2_FULL' && shouldPlaySplashSound() && audioRef.current) {
      // Delay sound slightly for impact
      setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Autoplay blocked - continue silently
        });
      }, TIMING.APEX_LOGO_START);
    }

    const timer = setTimeout(handleComplete, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [bootState, hasAssetError, handleComplete]);

  // Handle asset load errors
  const handleAssetError = useCallback(() => {
    console.warn('[SplashV2] Asset failed to load, using fallback');
    setHasAssetError(true);
  }, []);

  // Don't render if skipping or no boot state
  if (!bootState || bootState.decision.type === 'SKIP_SPLASH') {
    return null;
  }

  const isQuickFade = bootState.decision.type === 'SHOW_V2_QUICK_FADE';
  const showFallback = hasAssetError || bootState.decision.type === 'FALLBACK_STATIC';

  return (
    <div
      className={`splash-v2-root ${isExiting ? 'exiting' : ''} ${isQuickFade ? 'quick-fade' : ''}`}
      role="dialog"
      aria-label="TradeLine 24/7 is loading"
      aria-modal="true"
      data-testid="splash-v2"
    >
      {showFallback ? (
        // Fallback static screen
        <div className="splash-v2-fallback">
          <img
            src={APEX_LOGO_PATH}
            alt="APEX"
            className="splash-v2-fallback-logo"
            onError={handleAssetError}
          />
          <span className="splash-v2-fallback-text">TradeLine 24/7</span>
        </div>
      ) : (
        // Full animated experience
        <>
          {/* Heart animation with pixie dust */}
          <div className="splash-v2-heart-container">
            <HeartPath />
            <PixieDust />
          </div>

          {/* APEX logo materialization */}
          <img
            src={APEX_LOGO_PATH}
            alt="APEX"
            className="splash-v2-apex-logo"
            onError={handleAssetError}
          />

          {/* Text content */}
          <p className="splash-v2-text">TDA-backed biobytes</p>

          {/* Sponsor section */}
          <div className="splash-v2-sponsor" data-testid="splash-v2-sponsor">
            <span className="splash-v2-sponsor-label">Powered by</span>
            <img
              src={ALBERTA_INNOVATES_LOGO_PATH}
              alt="Alberta Innovates"
              className="splash-v2-sponsor-logo"
              onError={handleAssetError}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SplashV2;
