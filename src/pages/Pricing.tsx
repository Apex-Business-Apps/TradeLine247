import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";
import { paths } from "@/routes/paths";

interface PlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  id: string;
  planId: "default" | "core" | "commission";
  badge?: string;
}

const plans: PlanCard[] = [
  {
    name: "Starter (Solo Operators)",
    price: "Free trial · $199/mo after",
    description: "For trades, clinics, and solo operators who need 24/7 coverage without extra staff.",
    features: [
      "Includes 300 answered minutes during trial",
      "Hosted in Canada · SOC 2 posture · PIPEDA/PIPA-ready",
      "Instant email summaries & CRM-ready exports",
      "Forward from your cell or business line in minutes",
    ],
    cta: "Start Starter Trial",
    id: "starter",
    planId: "default",
    badge: "Best for solo",
  },
  {
    name: "Predictable Plus",
    price: "$69 setup · $249/mo",
    description: "Flat-rate coverage for growing teams that need guaranteed 24/7 answering.",
    features: [
      "Unlimited answered minutes with fair usage",
      "Live agent fallback & bilingual options",
      "Calendar + CRM pushes included",
      "Dedicated success manager in Canada",
    ],
    cta: "Choose Predictable",
    id: "predictable",
    planId: "core",
    badge: "Most popular",
  },
  {
    name: "Commission Accelerator",
    price: "$149 setup · 12% per booked job",
    description: "No monthly fee — only pay when TradeLine books qualified appointments for you.",
    features: [
      "Qualified = unique caller · >60s talk time · verified intent",
      "Wallet auto-recharge (min $200) with live usage alerts",
      "Ideal for seasonal peaks or expansion crews",
      "Full transcripts & call recordings for every lead",
    ],
    cta: "Start Zero-Monthly",
    id: "commission",
    planId: "commission",
    badge: "No monthly fee",
  },
];

const Pricing = () => {
  return (
    <div
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
      <SEOHead
        title="Pricing - TradeLine 24/7 AI Receptionist Plans"
        description="Simple, transparent pricing for 24/7 AI receptionist services. Choose starter, flat-rate, or commission plans — all hosted in Canada with compliance baked in."
        keywords="AI receptionist pricing, business automation cost, 24/7 answering service plans, Canadian call answering"
        canonical="https://tradeline247ai.com/pricing"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "TradeLine 24/7 AI Receptionist Service",
          "description": "24/7 AI receptionist and customer service automation for service businesses",
          "brand": {
            "@type": "Organization",
            "name": "Apex Business Systems",
          },
          "offers": plans.map((plan) => ({
            "@type": "Offer",
            "name": plan.name,
            "price": plan.planId === "commission" ? "0" : plan.planId === "core" ? "249" : "199",
            "priceCurrency": "CAD",
            "description": plan.description,
            "url": `https://tradeline247ai.com/auth?plan=${plan.planId}`,
          })),
        }}
      />

      <div className="relative z-10" style={{ minHeight: "100vh" }}>
        <main className="flex-1">
          <div className="bg-background/85 backdrop-blur-sm">
            <section className="px-4 py-20">
              <div className="container mx-auto text-center space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  <CheckCircle className="h-4 w-4" /> Free 7-day trial on every plan
                </span>
                <h1 className="mt-0 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  Simple, transparent pricing for 24/7 coverage
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
                  TradeLine 24/7 is hosted in Canada with PIPEDA/PIPA readiness, SOC 2 posture, and support in 55+ languages.
                  Pick the plan that matches your call volume and only pay for the protection you need.
                </p>
              </div>
            </section>
          </div>

          <div className="bg-background/85 backdrop-blur-sm">
            <section className="py-20">
              <div className="container mx-auto">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      id={plan.id}
                      className={`relative flex h-full flex-col border-border/60 bg-card/90 shadow-lg ${plan.badge === 'Most popular' ? 'ring-2 ring-primary' : ''}`}
                    >
                      {plan.badge && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          {plan.badge === 'Most popular' && <Star className="mr-1 h-4 w-4" />} {plan.badge}
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-6">
                        <div>
                          <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                          <p className="mt-2 text-sm text-muted-foreground">Free 7-day trial · cancel anytime</p>
                        </div>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <CheckCircle className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button asChild size="lg" className="mt-auto w-full">
                          <a href={`${paths.auth}?plan=${plan.planId}`}>{plan.cta}</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-16 rounded-3xl bg-muted/30 p-8 text-center">
                  <h3 className="text-2xl font-bold text-foreground">Every plan includes</h3>
                  <div className="mt-6 grid grid-cols-1 gap-6 text-sm text-muted-foreground md:grid-cols-3">
                    <div>
                      <h4 className="font-semibold text-foreground">Security & Compliance</h4>
                      <p>SOC 2 posture, Canadian data residency, encryption end-to-end.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">AI + Human Handoff</h4>
                      <p>Seamless escalation to your team with transcripts and call recordings.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Flexible Integrations</h4>
                      <p>CRM pushes, calendar routing, and developer-friendly APIs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Pricing;
