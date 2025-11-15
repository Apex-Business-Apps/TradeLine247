import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Star, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { TrustBadgesSlim } from "@/components/sections/TrustBadgesSlim";
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { ImpactStrip } from "@/components/sections/ImpactStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";
import { NoAIHypeFooter } from "@/components/sections/NoAIHypeFooter";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AISEOHead } from "@/components/seo/AISEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import RoiCalculator from "@/components/RoiCalculator";
import { errorReporter } from "@/lib/errorReporter";
import { paths } from "@/routes/paths";

const HERO_PRIMARY_CTA = `${paths.auth}?plan=default`;

const TrustBar = () => (
  <div className="bg-muted/80 border border-border/60 rounded-xl px-6 py-4 shadow-sm" aria-label="Trust highlights">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 text-success" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">Trusted by operators coast to coast</p>
          <p className="text-xs text-muted-foreground">⭐ 4.9/5 from small service businesses</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-info" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">Built & hosted in Canada</p>
          <p className="text-xs text-muted-foreground">PIPEDA/PIPA-ready with SOC 2 posture</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-warning" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">Made for trades & clinics</p>
          <p className="text-xs text-muted-foreground">Plumbers, HVAC, wellness & solo operators</p>
        </div>
      </div>
    </div>
  </div>
);

const StickyMobileCTA = () => (
  <div className="fixed inset-x-0 bottom-0 z-40 bg-background/95 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] md:hidden">
    <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Free 7-day trial</p>
        <p className="text-sm text-foreground">Activate your AI receptionist in one click.</p>
      </div>
      <Button asChild size="lg" className="min-w-[140px]" id="start-trial-hero-mobile">
        <Link to={HERO_PRIMARY_CTA}>Start Free Trial</Link>
      </Button>
    </div>
  </div>
);

const Testimonial = () => (
  <Card className="bg-card/80 border-border/60 p-8 shadow-sm" aria-label="Customer testimonial">
    <div className="space-y-4 text-left">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Customer spotlight</p>
      <blockquote className="space-y-4">
        <p className="text-xl font-semibold leading-relaxed text-foreground">
          “TradeLine 24/7 books qualified jobs while we’re on-site. The AI receptionist handles after-hours calls in
          55+ languages and keeps our crews scheduled back-to-back.”
        </p>
        <footer className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Amelia Reyes</span>, Owner, Edmonton Comfort HVAC
        </footer>
      </blockquote>
    </div>
  </Card>
);

const RoiPromo = () => (
  <section id="roi-calculator" className="container mx-auto px-4 py-16">
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-wide text-success">ROI calculator</p>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How much are missed calls costing you?
        </h2>
        <p className="text-lg text-muted-foreground">
          Estimate the revenue you can recover by letting TradeLine 24/7 answer every call. Operators see missed-call
          recovery within the first week.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
        <Link to={`${paths.auth}?plan=commission`}>Start Zero-Monthly Trial</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to={paths.missedCallsCalculator}>Open full calculator</Link>
      </Button>
        </div>
      </div>
      <RoiCalculator />
    </div>
  </section>
);

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
      <StickyMobileCTA />
      <div
        id="app-home"
        className="relative flex min-h-screen flex-col"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "hsl(0 0% 97%)",
        }}
      >
        <div className="relative z-10 flex-1 bg-background/92 backdrop-blur">
          <AISEOHead
            title="AI Receptionist for Service Businesses | TradeLine 24/7"
            description="TradeLine 24/7 is the AI receptionist that never misses a call. Built in Canada for trades, clinics, and solo operators. Start your free 7-day trial and work while you sleep."
            canonical="https://tradeline247ai.com/"
            contentType="service"
            directAnswer="TradeLine 24/7 is a Canadian-hosted AI receptionist that answers, qualifies, and books calls for service businesses 24/7."
            primaryEntity={{
              name: "TradeLine 24/7 AI Receptionist",
              type: "Service",
              description: "24/7 AI receptionist for trades, home services, clinics, and solo operators.",
            }}
            keyFacts={[
              { label: "Response time", value: "< 2 seconds" },
              { label: "Coverage", value: "24/7/365" },
              { label: "Languages", value: "55+" },
              { label: "Hosting", value: "Canada" },
            ]}
            faqs={[
              {
                question: "Who is TradeLine 24/7 built for?",
                answer:
                  "Trades, home services, clinics, and solo operators who can’t afford missed calls. We answer, qualify, and book jobs in your playbook.",
              },
              {
                question: "Is TradeLine 24/7 a credit tradeline service?",
                answer:
                  "No. We are an AI receptionist app for service businesses. We do not sell or manage credit tradelines or financial products.",
              },
              {
                question: "How fast can we go live?",
                answer:
                  "Onboarding takes one click. We provision a Canadian-hosted AI receptionist immediately so you can forward calls and start testing right away.",
              },
              {
                question: "Where is data stored?",
                answer:
                  "All voice data and transcripts are hosted in Canada with encryption in transit and at rest. We maintain a SOC 2 aligned posture and PIPEDA/PIPA readiness.",
              },
            ]}
            ogMeta={{
              title: "TradeLine 24/7 – AI Receptionist for Service Businesses",
              description:
                "Never miss another call. TradeLine 24/7 answers, qualifies, and books jobs for trades, clinics, and solo operators. Free 7-day trial.",
              image: "/og/tradeline-fast-trust.jpg",
              url: "https://tradeline247ai.com/",
            }}
            twitterMeta={{
              title: "Your 24/7 AI Receptionist | TradeLine 24/7",
              description:
                "Hosted in Canada, ready in one click. TradeLine 24/7 captures every call for service businesses.",
              image: "/og/tradeline-fast-trust.jpg",
            }}
          />

          <main className="flex-1">
            <section className="container mx-auto grid gap-10 px-4 pb-24 pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-8">
                <p className="text-sm font-medium uppercase tracking-wide text-success">AI receptionist for service businesses</p>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Your 24/7 AI Receptionist – Never Miss Another Call
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  TradeLine 24/7 answers, qualifies, and books calls while you’re on the job or off the clock. Hosted in Canada,
                  ready in one click, fluent in 55+ languages.
                </p>
                <div className="flex flex-wrap items-center gap-4" id="start-trial-hero">
                  <Button asChild size="lg" className="min-w-[190px]">
                    <Link to={HERO_PRIMARY_CTA}>Start Free 7-Day Trial</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to={paths.pricing}>See pricing</Link>
                  </Button>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground">One-click onboarding</p>
                    <p>No paperwork or phone tag. Forward your number and we handle the rest.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Canadian compliance</p>
                    <p>Encrypted, PIPEDA/PIPA ready, SOC 2 posture baked in.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg backdrop-blur-sm">
                <div className="space-y-6">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Fast-trust playbook</p>
                  <ol className="space-y-4 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-sm font-semibold text-success">1</span>
                      <div>
                        <p className="text-base font-semibold text-foreground">Activate your trial</p>
                        <p>Use your work email to receive a secure magic link—no passwords needed.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-sm font-semibold text-warning">2</span>
                      <div>
                        <p className="text-base font-semibold text-foreground">Forward your calls</p>
                        <p>We provision a TradeLine number instantly so you can test in minutes.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-info/20 text-sm font-semibold text-info">3</span>
                      <div>
                        <p className="text-base font-semibold text-foreground">Capture every lead</p>
                        <p>AI answers in 55+ languages, qualifies, and books jobs into your calendar.</p>
                      </div>
                    </li>
                  </ol>
                  <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Works while you sleep</p>
                    <p>Operators report 30–45% more booked jobs from nights & weekends alone.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="container mx-auto px-4 pb-16">
              <TrustBar />
            </section>

            <section className="container mx-auto px-4 pb-16">
              <BenefitsGrid />
            </section>

            <section className="container mx-auto px-4 pb-16">
              <ImpactStrip />
            </section>

            <section className="container mx-auto px-4 pb-16">
              <HowItWorks />
            </section>

            <section className="container mx-auto px-4 pb-16">
              <div className="mx-auto max-w-5xl rounded-3xl bg-background/90 p-10 shadow-lg">
                <div className="space-y-6 text-center">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Operator shortcuts</p>
                  <h2 className="text-3xl font-bold text-foreground">Control centre for busy teams</h2>
                  <p className="text-lg text-muted-foreground">
                    Run daily workflows without digging. These shortcuts stay pinned for your crew and update instantly.
                  </p>
                  <QuickActionsCard />
                </div>
              </div>
            </section>

            <RoiPromo />

            <section className="container mx-auto px-4 pb-16">
              <Testimonial />
            </section>

            <section className="container mx-auto px-4 pb-20">
              <TrustBadgesSlim />
            </section>

            <section className="container mx-auto px-4 pb-20">
              <LeadCaptureForm />
            </section>
          </main>

          <Footer />
          <NoAIHypeFooter />
        </div>
      </div>
    </>
  );
};

export default Index;
