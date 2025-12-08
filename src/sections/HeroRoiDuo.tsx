/**
 * 🔒 HERO SECTION COMPONENT - PROTECTED BY PERMANENT SAFEGUARDS 🔒
 * 
 * CRITICAL: READ HERO_GUARDRAILS.md BEFORE MODIFYING
 * 
 * This component is actively monitored by:
 * - heroGuardian.ts (performance + structure validation)
 * - layoutCanon.ts (layout validation)
 * - layoutGuard.ts (self-healing)
 * 
 * Protected Elements:
 * - Brand title: "Your 24/7 Ai Receptionist" (DO NOT CHANGE)
 * - data-node attributes (REQUIRED for validation)
 * - Safe area insets (REQUIRED for mobile/PWA)
 * - Logo optimization (eager loading + aspectRatio)
 * - Fluid typography (clamp() only, NO fixed units)
 * 
 * Performance Targets (ENFORCED):
 * - LCP ≤ 2.5s
 * - CLS ≤ 0.05
 * 
 * Any violations will trigger console errors and may block deployment.
 */

// LOVABLE-GUARD: Only import existing components; do not alter their internals.
import React from "react";
import "../styles/hero-roi.css";
import { LeadCaptureCard } from "../components/sections/LeadCaptureCard";
import RoiCalculator from "../components/RoiCalculator";
import officialLogo from '@/assets/official-logo.png';
import backgroundImage from '@/assets/BACKGROUND_IMAGE1.svg';

export default function HeroRoiDuo() {
  return <section 
    className="hero-section section-heavy overflow-hidden min-h-screen bg-contain bg-top bg-no-repeat bg-scroll md:bg-cover md:bg-top lg:min-h-screen" 
    style={{
      paddingTop: 'max(env(safe-area-inset-top, 0), 3rem)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0), 3rem)',
      paddingLeft: 'env(safe-area-inset-left, 0)',
      paddingRight: 'env(safe-area-inset-right, 0)',
      backgroundImage: `url(${backgroundImage})`,
      backgroundAttachment: 'scroll',
    }} 
    data-lovable-lock="structure-only"
  >
      <div className="hero-gradient" aria-hidden="true" data-testid="hero-bg"></div>
      <div className="hero-gradient-overlay" aria-hidden="true"></div>
      <div className="hero-vignette" aria-hidden="true"></div>
      <div className="container relative z-10" data-lovable-lock="structure-only">
        {/* Hero Content */}
        <div className="text-center mb-16" data-lovable-lock="structure-only">

          {/* Logo above hero text - LOCKED */}
          <div className="flex justify-center mb-8 min-h-[13.3125rem] md:min-h-[17.15625rem] items-center" data-lovable-lock="structure-only">
            <img 
              src={officialLogo} 
              alt="TradeLine 24/7 Logo" 
              width="189"
              height="189"
              className="h-[9.1875rem] md:h-[11.8125rem] w-auto opacity-80" 
              style={{ 
                transform: 'translateY(-0.5cm) scale(1.5225) scaleY(1.388625) scaleX(1.388625)',
                filter: 'drop-shadow(0 4px 8px hsl(0 0% 0% / 0.1))'
              }}
              loading="eager"
              fetchpriority="high"
              data-lovable-lock="structure-only"
            />
          </div>

          <h1 id="hero-h1" className="hero-headline font-extrabold mb-6" style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4.5rem)', lineHeight: '1.1' }} data-lovable-lock="permanent">
            Your 24/7 Ai Receptionist!
          </h1>
          <p className="hero-tagline mb-8 max-w-3xl mx-auto font-semibold" style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 2.5rem)', lineHeight: '1.5' }} data-lovable-lock="structure-only">
            Never miss a call. Work while you sleep.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm md:text-base">
            <a href="/security" className="feature-badge font-medium">🔒 Enterprise Security</a>
            <a href="/compare" className="feature-badge font-medium">📊 Compare Services</a>
            <a href="/pricing" className="feature-badge font-medium">💰 See Pricing</a>
          </div>

          {/* Premium Phone Number - Hero text orange (#FF6B35) */}
          <a
            href="tel:+15877428885"
            className="inline-flex items-center gap-3 px-6 py-3 mb-8 text-xl md:text-2xl font-bold bg-white backdrop-blur-sm rounded-full shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 border-2 border-primary/20"
            style={{ color: '#FF6B35' }}
            aria-label="Call for demo"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: '#FF6B35' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>587-742-8885</span>
            <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#FF6B35' }}>FOR DEMO</span>
          </a>

          <h2 className="hero-tagline mb-12 mt-16 text-center py-0 font-semibold mx-auto" style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 2.5rem)' }} data-lovable-lock="structure-only">Help us help you.</h2>

          {/* Custom grid layout for side-by-side components */}
          <div className="hero-roi__container mx-auto" data-lovable-lock="structure-only" aria-label="Start Trial and ROI">
            <div className="hero-roi__grid" data-node="grid" data-lovable-lock="structure-only">
              <div id="roi-calculator" data-node="ron" data-lovable-lock="structure-only">
                <RoiCalculator />
              </div>
              <div id="start-trial-hero" data-node="start" data-lovable-lock="structure-only">
                <LeadCaptureCard compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}
