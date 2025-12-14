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

const BACKGROUND_IMAGE_URL = backgroundImage;
const LANDING_BACKGROUND_COLOR = "hsl(0, 0%, 97%)";

// Single wallpaper layer — DO NOT DUPLICATE elsewhere.
// NOTE: sizing/position are handled by CSS on .landing-wallpaper to remain stable + non-cropping.
const createWallpaperStyle = (imageUrl: string): CSSProperties => ({
  backgroundImage: `url(${imageUrl})`,
});

export default function Index() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView("home");
  }, [trackPageView]);

  // Preload background to reduce flash + improve perceived performance
  useEffect(() => {
    const img = new Image();
    img.src = BACKGROUND_IMAGE_URL;
    img.onerror = () => {
      // keep error reporting best-effort and non-blocking
      try {
        errorReporter.report({
          type: "error",
          message: "Background image failed to load",
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: { imageSrc: BACKGROUND_IMAGE_URL },
        });
      } catch {
        // no-op
      }
    };
  }, []);

  const wallpaperStyle = useMemo(
    () => createWallpaperStyle(BACKGROUND_IMAGE_URL),
    []
  );

  return (
    <div
      id="app-home"
      className="landing-shell min-h-screen flex flex-col relative"
      style={{ backgroundColor: LANDING_BACKGROUND_COLOR }}
    >
      {/* Single wallpaper + single mask. Do not remove without founder sign-off. */}
      <div
        className="landing-wallpaper"
        data-testid="landing-wallpaper"
        aria-hidden="true"
        style={wallpaperStyle}
      />
      <div
        className="landing-mask"
        data-testid="landing-mask"
        aria-hidden="true"
      />

      <div className="landing-content relative z-10 flex-1 flex flex-col">
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

        <div className="flex-1">
          <div className="hero-background">
            <HeroRoiDuo />
          </div>

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
}
