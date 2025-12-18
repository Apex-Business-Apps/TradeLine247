import { CSSProperties, useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import HeroRoiDuo from "@/sections/HeroRoiDuo";
import { TrustBadgesSlim } from "@/components/sections/TrustBadgesSlim";
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { ImpactStrip } from "@/components/sections/ImpactStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";
import { NoAIHypeFooter } from "@/components/sections/NoAIHypeFooter";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AISEOHead } from "@/components/seo/AISEOHead";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { errorReporter } from "@/lib/errorReporter";
import { LandingBackgroundLayers } from "@/components/landing/LandingBackgroundLayers";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView("home");
  }, [trackPageView]);

  // Preload background image for faster rendering
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onerror = () => {
      errorReporter.report({
        type: 'error',
        message: 'Background image failed to load',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { imageSrc: backgroundImage }
      });
    };
  }, []);

  // #region agent log
  useEffect(() => {
    // Write directly to file using Node.js fs (for browser, use a different approach)
    // Since we're in browser, use console and also try to write to a data attribute
    const logDebug = (hypothesisId: string, message: string, data: any) => {
      const logEntry = {
        location: 'Index.tsx:useEffect',
        message,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId
      };
      // Try HTTP logging
      fetch('http://127.0.0.1:7244/ingest/1a394b6c-8b02-4da6-944b-d1731ecd3598', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(() => {});
      // Console fallback
      console.log(`[DEBUG ${hypothesisId}]`, message, data);
      // Store in window for inspection
      if (!(window as any).__debugLogs) {
        (window as any).__debugLogs = [];
      }
      (window as any).__debugLogs.push(logEntry);
    };

    // H1: Check if fixed overlays are blocking scroll
    const overlays = document.querySelectorAll('.landing-wallpaper, .landing-mask, .hero-gradient-overlay, .content-gradient-overlay');
    overlays.forEach((el, i) => {
      const style = window.getComputedStyle(el);
      logDebug('H1', `Overlay ${i} scroll blocking check`, {
        className: el.className,
        position: style.position,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        top: style.top,
        bottom: style.bottom
      });
    });

    // H2: Check page/document dimensions
    logDebug('H2', 'Page dimensions check', {
      documentHeight: document.documentElement.scrollHeight,
      documentClientHeight: document.documentElement.clientHeight,
      bodyHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      windowInnerHeight: window.innerHeight,
      scrollY: window.scrollY
    });

    // H3: Check footer position
    const footer = document.querySelector('footer');
    if (footer) {
      const rect = footer.getBoundingClientRect();
      logDebug('H3', 'Footer position check', {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        height: rect.height,
        isInViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      });
    }

    // H4: Check z-index stacking
    const mainContent = document.querySelector('#main-content');
    const contentOverlay = document.querySelector('.content-gradient-overlay');
    if (mainContent && contentOverlay) {
      const mainStyle = window.getComputedStyle(mainContent);
      const overlayStyle = window.getComputedStyle(contentOverlay);
      logDebug('H4', 'Z-index stacking check', {
        mainContentZIndex: mainStyle.zIndex,
        overlayZIndex: overlayStyle.zIndex,
        mainContentPosition: mainStyle.position,
        overlayPosition: overlayStyle.position,
        overlayPointerEvents: overlayStyle.pointerEvents
      });
    }

    // H5: Check container overflow
    const main = document.querySelector('#main');
    if (main) {
      const style = window.getComputedStyle(main);
      const rect = main.getBoundingClientRect();
      logDebug('H5', 'Main container overflow check', {
        overflow: style.overflow,
        overflowY: style.overflowY,
        height: style.height,
        minHeight: style.minHeight,
        maxHeight: style.maxHeight,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        rectHeight: rect.height,
        canScroll: main.scrollHeight > main.clientHeight
      });
    }

    // Additional: Check if page is actually scrollable
    setTimeout(() => {
      logDebug('H2', 'Delayed page dimensions after render', {
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        windowInnerHeight: window.innerHeight,
        canScrollDocument: document.documentElement.scrollHeight > document.documentElement.clientHeight,
        canScrollBody: document.body.scrollHeight > document.body.clientHeight,
        scrollY: window.scrollY,
        maxScrollY: document.documentElement.scrollHeight - window.innerHeight
      });

      // Check footer accessibility
      const footer = document.querySelector('footer');
      const privacyLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.textContent?.toLowerCase().includes('privacy')
      );
      if (footer && privacyLink) {
        const footerRect = footer.getBoundingClientRect();
        const linkRect = privacyLink.getBoundingClientRect();
        logDebug('H3', 'Footer and privacy link position after render', {
          footerTop: footerRect.top,
          footerBottom: footerRect.bottom,
          footerInViewport: footerRect.top < window.innerHeight && footerRect.bottom > 0,
          linkTop: linkRect.top,
          linkBottom: linkRect.bottom,
          linkInViewport: linkRect.top < window.innerHeight && linkRect.bottom > 0,
          linkVisible: linkRect.width > 0 && linkRect.height > 0,
          linkDisplay: window.getComputedStyle(privacyLink).display,
          linkVisibility: window.getComputedStyle(privacyLink).visibility,
          linkPointerEvents: window.getComputedStyle(privacyLink).pointerEvents,
          documentScrollHeight: document.documentElement.scrollHeight,
          documentClientHeight: document.documentElement.clientHeight,
          windowInnerHeight: window.innerHeight,
          needsScroll: linkRect.bottom > window.innerHeight,
          maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
          currentScrollY: window.scrollY
        });

        // Test if we can actually scroll to the footer
        const originalScrollY = window.scrollY;
        window.scrollTo(0, document.documentElement.scrollHeight);
        setTimeout(() => {
          const afterScrollY = window.scrollY;
          const linkRectAfter = privacyLink.getBoundingClientRect();
          logDebug('H2', 'Scroll test results', {
            originalScrollY,
            afterScrollY,
            scrollWorked: afterScrollY > originalScrollY,
            linkTopAfterScroll: linkRectAfter.top,
            linkInViewportAfterScroll: linkRectAfter.top < window.innerHeight && linkRectAfter.bottom > 0,
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight
          });
          // Reset scroll
          window.scrollTo(0, originalScrollY);
        }, 100);
      }
    }, 1000);
  }, []);
  // #endregion

  return (
    <>
      {/* Background layers - fixed, non-interactive, proper z-index stacking */}
      <LandingBackgroundLayers />
      
      {/* Main content container */}
      <div id="main" className="landing-shell min-h-screen flex flex-col relative">
        <div id="main-content" className="landing-content relative z-10">
          <AISEOHead
              title="TradeLine 24/7 - Your 24/7 AI Receptionist!"
              description="Get fast and reliable customer service that never sleeps. Handle calls, messages, and inquiries 24/7 with human-like responses. Start growing now!"
              canonical="/"
              contentType="service"
              directAnswer="TradeLine 24/7 is an AI-powered receptionist service that answers phone calls 24/7, qualifies leads based on your criteria, and sends clean email transcripts to Canadian businesses. Never miss a call. Work while you sleep."
              primaryEntity={{
                name: "TradeLine 24/7 AI Receptionist Service",
                type: "Service",
                description: "24/7 AI-powered phone answering service for Canadian businesses",
              }}
              keyFacts={[
                { label: "Availability", value: "24/7" },
                { label: "Response Time", value: "<2 seconds" },
                { label: "Uptime", value: "99.9%" },
                { label: "Service Area", value: "Canada" },
              ]}
              faqs={[
                {
                  question: "What is TradeLine 24/7?",
                  answer:
                    "TradeLine 24/7 is an AI-powered receptionist service that answers phone calls 24/7, qualifies leads based on your criteria, and sends clean email transcripts. It never misses a call and works while you sleep.",
                },
                {
                  question: "How does TradeLine 24/7 work?",
                  answer:
                    "When a call comes in, our AI answers immediately, has a natural conversation with the caller, qualifies them based on your criteria, and sends you a clean email transcript with all the details.",
                },
                {
                  question: "What areas does TradeLine 24/7 serve?",
                  answer:
                    "TradeLine 24/7 serves businesses across Canada, with primary operations in Edmonton, Alberta.",
                },
                {
                  question: "How much does TradeLine 24/7 cost?",
                  answer:
                    "TradeLine 24/7 offers flexible pricing: $149 CAD per qualified appointment (pay-per-use) or $249 CAD per month for the Predictable Plan.",
                },
              ]}
            />

          {/* Hero section - gradient now applied via fixed overlay */}
          {/* WCAG AA: Large text needs 3:1 contrast; text-shadows enhance readability */}
          <div className="relative">
            <HeroRoiDuo />
          </div>

          {/* Rest of page - gradient now applied via fixed overlay */}
          <div className="relative">
            <BenefitsGrid />
            <ImpactStrip />
            <HowItWorks />
            <div className="container mx-auto px-4 py-12">
              <div className="mx-auto max-w-4xl space-y-6 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Quick actions for operators
                </h2>
                <p className="text-muted-foreground">
                  Jump straight into the workflows you use every day. These shortcuts survive refreshes and deep links.
                </p>
                <QuickActionsCard />
              </div>
            </div>
            <TrustBadgesSlim />
            <LeadCaptureForm />
            <Footer />
            <NoAIHypeFooter />
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
