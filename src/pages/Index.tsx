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

  const wallpaperStyle = {
    backgroundImage: `url(${backgroundImage})`,
  } as CSSProperties;

  const wallpaperVariables = {
    ["--hero-wallpaper-image" as const]: `url(${backgroundImage})`,
  } as CSSProperties;

  return (
    <>
      {/* Background stack - must be siblings, fixed, non-interactive */}
      <div className="landing-wallpaper fixed inset-0 bg-cover" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" data-bg-layer="true"></div>
      <div className="landing-mask fixed inset-0" style={{ backgroundImage: `linear-gradient(to bottom, rgba(255,107,53,0.55) 0%, rgba(104,182,233,0.55) 100%)` }} aria-hidden="true" data-bg-layer="true"></div>
      <div className="hero-gradient-overlay fixed inset-0" style={{ backgroundImage: `linear-gradient(to bottom, rgba(255, 107, 53, 0.40) 0%, rgba(104, 182, 233, 0.40) 100%)` }} aria-hidden="true" data-bg-layer="true"></div>
      <div className="content-gradient-overlay fixed inset-0" style={{ backgroundImage: `linear-gradient(to bottom, rgba(255, 107, 53, 0.72) 0%, rgba(104, 182, 233, 0.72) 100%)` }} aria-hidden="true" data-bg-layer="true"></div>
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
