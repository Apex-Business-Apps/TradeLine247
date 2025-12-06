import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

const plans = [
  {
    name: "Professional Plan",
    price: "$499/month",
    description: "Perfect for growing businesses with advanced AI receptionist capabilities",
    features: [
      "Up to 1,000 calls per month",
      "Advanced AI receptionist with emotional intelligence",
      "Basic booking system with calendar integration",
      "Email/SMS confirmations",
      "Real-time analytics dashboard",
      "CRM integration (1 connector)",
      "99.9% uptime SLA",
      "Email support"
    ],
    cta: "Start Professional",
    popular: false,
    id: "professional",
    link: "/auth?plan=professional"
  },
  {
    name: "Business Plan",
    price: "$999/month",
    description: "Complete enterprise solution with advanced booking system",
    features: [
      "Up to 5,000 calls per month",
      "Enterprise AI receptionist with custom personality",
      "Advanced booking system with credit card commitment",
      "Google Calendar/Outlook integration",
      "Automated confirmation workflows",
      "CRM integration (3 connectors)",
      "Advanced analytics & reporting",
      "Priority phone support",
      "Custom AI training",
      "API access"
    ],
    cta: "Choose Business",
    popular: true,
    id: "business",
    link: "/auth?plan=business"
  },
  {
    name: "Enterprise Plan",
    price: "$2,499/month",
    description: "Full enterprise platform with unlimited capabilities",
    features: [
      "Unlimited calls",
      "Complete AI receptionist platform",
      "Advanced booking system with payment processing",
      "Multi-calendar integration",
      "Custom workflow automation",
      "Unlimited CRM integrations",
      "Enterprise security (SOC 2, PCI DSS)",
      "24/7 dedicated support",
      "Custom development",
      "On-premises deployment option",
      "Advanced AI model customization",
      "White-label solution"
    ],
    cta: "Contact Enterprise",
    popular: false,
    id: "enterprise",
    link: "/contact?plan=enterprise"
  }
];

const Pricing = () => {
  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "hsl(0, 0%, 97%)",
      }}
    >
      <SEOHead
        title="Enterprise Pricing - TradeLine 24/7 AI Receptionist Platform"
        description="Enterprise-grade AI receptionist pricing: Professional ($499/month), Business ($999/month), Enterprise ($2,499/month). Advanced booking system, emotional intelligence, and 99.9% uptime SLA."
        keywords="enterprise AI receptionist pricing, advanced booking system cost, emotional intelligence AI pricing, enterprise security pricing, SOC 2 compliance pricing"
        canonical="https://www.tradeline247ai.com/pricing"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "TradeLine 24/7 AI Receptionist Service",
          "description": "24/7 AI receptionist and customer service automation for businesses",
          "brand": {
            "@type": "Organization",
            "name": "Apex Business Systems"
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Zero-Monthly Plan (Pilot)",
              "price": "149",
              "priceCurrency": "CAD",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "149",
                "priceCurrency": "CAD",
                "unitText": "one-time setup fee"
              },
              "description": "One-time setup, then pay only for results",
              "url": "https://www.tradeline247ai.com/auth?plan=commission"
            },
            {
              "@type": "Offer", 
              "name": "Predictable Plan",
              "price": "318",
              "priceCurrency": "CAD",
              "priceSpecification": {
                "@type": "AggregateOffer",
                "lowPrice": "69",
                "highPrice": "249",
                "priceCurrency": "CAD",
                "offers": [
                  {
                    "@type": "Offer",
                    "price": "69",
                    "priceCurrency": "CAD",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "69",
                      "priceCurrency": "CAD",
                      "unitText": "one-time setup fee"
                    }
                  },
                  {
                    "@type": "Offer",
                    "price": "249",
                    "priceCurrency": "CAD",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "249",
                      "priceCurrency": "CAD",
                      "unitText": "per month"
                    }
                  }
                ]
              },
              "description": "Fixed monthly pricing with one-time setup",
              "url": "https://www.tradeline247ai.com/auth?plan=core"
            }
          ]
        }}
      />
      
      <div className="relative z-10" style={{ minHeight: "100vh" }}>
        <div className="flex-1">
          {/* Hero Section */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section style={{
              paddingTop: 'max(env(safe-area-inset-top, 0), 5rem)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0), 5rem)',
              paddingLeft: 'env(safe-area-inset-left, 0)',
              paddingRight: 'env(safe-area-inset-right, 0)'
            }}>
              <div className="container text-center">
                <h1 className="text-4xl md:text-6xl font-bold mt-0 mb-8 bg-gradient-to-r from-primary to-accent  text-foreground">
                  Enterprise-Grade Pricing
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                  Complete AI receptionist platform with advanced booking system, emotional intelligence, and enterprise security.
                </p>
              </div>
            </section>
          </div>

          {/* Pricing Cards */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
              <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {plans.map((plan, index) => (
                    <Card key={index} id={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}>
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          <Star className="w-4 h-4 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                      <CardHeader className="text-center pb-8">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="text-base">
                          {plan.description}
                        </CardDescription>
                        <div className="mt-4">
                          <span className="text-4xl font-bold">{plan.price}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-[hsl(142,85%,25%)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? "default" : "outline"}
                          size="lg"
                          asChild
                        >
                          <a href={plan.link}>{plan.cta}</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Additional Info */}
                <div className="text-center mt-16 p-8 bg-muted/30 rounded-lg">
                  <h3 className="text-2xl font-bold mb-4">All Plans Include</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">
                        <a href="/security" className="text-primary hover:underline">Security & Compliance</a>
                      </h4>
                      <p className="text-muted-foreground">SOC 2 compliant, GDPR ready, bank-level security</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">24/7 AI Coverage</h4>
                      <p className="text-muted-foreground">Never miss a call or message, even on weekends</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        <a href="/compare" className="text-primary hover:underline">Why Choose Us?</a>
                      </h4>
                      <p className="text-muted-foreground">See how we compare to traditional services</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* FAQ Section */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
              <div className="container text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Frequently Asked Questions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                  <div>
                    <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                    <p className="text-muted-foreground text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">What are the setup fees?</h3>
                    <p className="text-muted-foreground text-sm">Zero-Monthly Plan: $149 CAD one-time setup. Predictable Plan: $69 CAD one-time setup. All plans include onboarding and training.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
                    <p className="text-muted-foreground text-sm">We'll notify you before limits are reached and help you upgrade to a plan that fits your needs.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                    <p className="text-muted-foreground text-sm">Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        <div className="bg-background/85 backdrop-blur-[2px]">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Pricing;
