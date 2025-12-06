import { useEffect } from "react";
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

  return (
    <>
      <div
        id="app-home"
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "hsl(0, 0%, 97%)", // Fallback color if image fails (light gray)
        }}
      >
        <div className="fixed inset-0 z-0 pointer-events-none"></div>
        {/* Content with translucency - Optimized for performance */}
        <div className="relative z-10" style={{ minHeight: "100vh" }}>
          <AISEOHead
            title="TradeLine 24/7 - Enterprise AI Receptionist with Advanced Booking System"
            description="Enterprise-grade AI receptionist with emotional intelligence, secure booking system, calendar integration, and 99.9% uptime. Transform your customer service with human-like conversations and automated workflows."
            canonical="/"
            contentType="service"
            directAnswer="TradeLine 24/7 is an enterprise AI receptionist platform featuring advanced booking system, emotional intelligence, calendar integration, secure payments, and 99.9% uptime SLA. Complete business automation solution for modern enterprises."
            primaryEntity={{
              name: "TradeLine 24/7 Enterprise AI Receptionist Platform",
              type: "Service",
              description: "Enterprise-grade AI receptionist with advanced booking system and business automation",
            }}
            keyFacts={[
              { label: "Availability", value: "24/7/365" },
              { label: "Response Time", value: "<100ms" },
              { label: "Uptime SLA", value: "99.9%" },
              { label: "Security", value: "Enterprise-grade" },
              { label: "Integrations", value: "CRM + Calendar + Payments" },
              { label: "Compliance", value: "SOC 2 + GDPR + PCI DSS" },
            ]}
            faqs={[
              {
                question: "What is TradeLine 24/7 Enterprise?",
                answer:
                  "TradeLine 24/7 Enterprise is a comprehensive AI receptionist platform with advanced booking system, emotional intelligence, calendar integration, secure payment processing, and enterprise-grade security. It provides complete business automation with 99.9% uptime SLA.",
              },
              {
                question: "How does the advanced booking system work?",
                answer:
                  "Our enterprise booking system features secure credit card commitment (authorize without charging), automated calendar integration (Google/Outlook), personalized confirmation emails/SMS, and complete workflow automation with escalation protocols.",
              },
              {
                question: "What security measures are in place?",
                answer:
                  "TradeLine 24/7 Enterprise features military-grade security including SOC 2 Type II compliance, PCI DSS payment processing, GDPR compliance, multi-layered authentication, real-time monitoring, and comprehensive audit trails.",
              },
              {
                question: "How does the AI emotional intelligence work?",
                answer:
                  "Our AI receptionist recognizes 6 emotion categories (urgency, frustration, confusion, excitement, concern, satisfaction) and adapts responses accordingly. It maintains human-like conversations with personality customization and never interrupts callers.",
              },
              {
                question: "What integrations are supported?",
                answer:
                  "TradeLine 24/7 supports CRM integration, Google Calendar/Outlook sync, Stripe payment processing, Slack/Discord alerting, email/SMS delivery, and custom API integrations for complete business automation.",
              },
              {
                question: "What's included in enterprise monitoring?",
                answer:
                  "Enterprise monitoring includes 24/7 system health checks, real-time performance metrics, automated alerting, incident response workflows, security event tracking, and comprehensive analytics dashboard.",
              },
            ]}
          />

          <div className="flex-1" style={{ minHeight: "60vh" }}>
            {/* All sections now use 85% opacity to match secondary pages */}
            <div className="bg-background/85 backdrop-blur-[2px]" style={{ willChange: "transform" }}>
              <HeroRoiDuo />
            </div>
            <div className="bg-background/85 backdrop-blur-[2px]">
              <BenefitsGrid />
            </div>
            <div className="bg-background/85 backdrop-blur-[2px]">
              <ImpactStrip />
            </div>
            <div className="bg-background/85 backdrop-blur-[2px]">
              <HowItWorks />
            </div>
            <div className="bg-background/85 backdrop-blur-[2px]">
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
          </div>

          <div className="bg-background/85 backdrop-blur-[2px]">
            <TrustBadgesSlim />
          </div>

          <div className="bg-background/85 backdrop-blur-[2px]">
            <LeadCaptureForm />
          </div>

          <div className="bg-background/85 backdrop-blur-[2px]">
            <Footer />
          </div>

          <NoAIHypeFooter />
        </div>
      </div>
    </>
  );
};

export default Index;
