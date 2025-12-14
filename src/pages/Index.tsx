import { CSSProperties, useEffect, useMemo } from "react";

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

// Idempotent constants: computed once, reused across renders
const BACKGROUND_IMAGE_URL = backgroundImage;
const LANDING_BACKGROUND_COLOR = "hsl(0, 0%, 97%)";

// DO NOT CHANGE: Hero wallpaper background-image and responsive focal points are critical for visual identity.
// CSS handles responsive background-position (20% mobile, 15% tablet, center desktop) via media queries.
const createWallpaperStyle = (imageUrl: string): CSSProperties => ({
  backgroundImage: `url(${imageUrl})`,
  // backgroundPosition removed - CSS media queries handle responsive focal points (20% mobile, 15% tablet, center desktop)
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
});

const createLandingWallpaperVars = (imageUrl: string): CSSProperties => ({
  "--landing-wallpaper": `url(${imageUrl})`,
  "--hero-wallpaper-image": `url(${imageUrl})`,
} as CSSProperties);

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView("home");
  }, [trackPageView]);

  // Preload background image for faster rendering
  useEffect(() => {
    const img = new Image();
    img.src = BACKGROUND_IMAGE_URL;
    img.onerror = () => {
      errorReporter.report({
        type: "error",
        message: "Background image failed to load",
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter["getEnvironment"](),
        metadata: { imageSrc: BACKGROUND_IMAGE_URL },
      });
    };
  }, []);

  // Memoize styles to prevent recreation on every render (idempotent)
  const wallpaperStyle = useMemo(
    () => createWallpaperStyle(BACKGROUND_IMAGE_URL),
    []
  );

  const landingWallpaperVars = useMemo(
    () => createLandingWallpaperVars(BACKGROUND_IMAGE_URL),
    []
  );

  return (
    <div
      id="app-home"
      className="landing-shell min-h-screen flex flex-col relative"
      style={{
        ...landingWallpaperVars,
        backgroundColor: LANDING_BACKGROUND_COLOR,
      }}
    >
      <div className="landing-content relative z-10 flex-1 flex flex-col" style={{ minHeight: "100vh" }}>
        <AISEOHead
          title="TradeLine 24/7 - Your 24/7 AI Receptionist!"
          description="Get fast and reliable customer service that never sleeps. Handle calls, messages, and inquiries 24/7 with human-like responses. Start growing now!"
          canonical="/"
          contentType="service"
          directAnswer="TradeLine 24/7 is an AI-powered receptionist service that answers phone calls 24/7, qualifies leads, and sends clean transcripts via email to Canadian businesses. Never miss a call. Work while you sleep."
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

        <div className="flex-1" style={{ minHeight: "60vh" }}>
          {/* WARNING: Landing wallpaper + mask define the TradeLine 24/7 visual identity.
              Scoped to hero section only - do not change or remove these elements or their CSS without design + cofounder sign-off. */}
          <section className="hero-shell relative isolate bg-cover bg-[position:20%_center] md:bg-[position:15%_center] lg:bg-center" style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}>
            <div className="landing-wallpaper absolute inset-0" aria-hidden="true" style={wallpaperStyle}/>
            <div className="landing-mask absolute inset-0" aria-hidden="true"/>
            <div className="relative z-10">
              <HeroRoiDuo />
            </div>
          </section>

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
        </div>

        <TrustBadgesSlim />
        <LeadCaptureForm />
        <Footer />
        <NoAIHypeFooter />
      </div>
    </div>
  );
};

export default Index;
