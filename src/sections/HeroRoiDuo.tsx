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
            <span className="text-[#1e556b]">trA</span>
            <span className="text-[#FF6B35]">deline</span>
            <span className="text-[#FF6B35]"> 24/7</span>
          </h1>
          <p className="hero-tagline mb-4 max-w-3xl mx-auto font-semibold" style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 2.5rem)', lineHeight: '1.5', color: '#FF6B35' }} data-lovable-lock="structure-only">
            Your 24/7 AI Receptionist!
          </p>
          <p className="hero-tagline mb-8 max-w-3xl mx-auto font-semibold" style={{ fontSize: 'clamp(0.9rem, 1.5vw + 0.5rem, 1.5rem)', lineHeight: '1.5', color: '#1e556b' }} data-lovable-lock="structure-only">
            Never miss a call. Work while you sle
