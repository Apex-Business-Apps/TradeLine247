import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Phone, MessageSquare, Brain, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

const features = [
  {
    icon: Brain,
    title: "Fast and Reliable Reception",
    description: "Smart AI that handles calls, messages, and inquiries 24/7 with human-like responses",
    benefits: ["Natural conversation flow", "Multi-language support", "Learning capabilities", "Context awareness"]
  },
  {
    icon: Phone,
    title: "Intelligent Call Management", 
    description: "Advanced call routing, screening, and handling with real-time transcription",
    benefits: ["Smart call routing", "Voicemail transcription", "Call analytics", "Priority handling"]
  },
  {
    icon: MessageSquare,
    title: "Omnichannel Messaging",
    description: "Unified messaging across SMS, WhatsApp, email, and social platforms",
    benefits: ["Unified inbox", "Auto-responses", "Message templates", "Rich media support"]
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Easy integration with CRMs, calendars, and business tools",
    benefits: ["CRM integration", "Calendar sync", "Task automation", "Custom workflows"]
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with SOC 2 compliance and data protection",
    benefits: ["SOC 2 compliant", "End-to-end encryption", "GDPR ready", "Access controls"]
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a lead with round-the-clock AI receptionist coverage",
    benefits: ["Always available", "No breaks needed", "Consistent service", "Global coverage"]
  }
];

const Features = () => {
  const { trackPageView, trackButtonClick } = useAnalytics();

  useEffect(() => {
    trackPageView('features');
  }, [trackPageView]);

  const handleCTAClick = () => {
    trackButtonClick('features_cta', 'features_page');
  };
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Features - TradeLine 24/7 AI Receptionist"
        description="Discover powerful AI features: 24/7 call handling, smart routing, omnichannel messaging, CRM integration, and enterprise security. Upgrade your customer service today."
        keywords="AI receptionist features, call management, omnichannel messaging, CRM integration, business automation, 24/7 customer service"
        canonical="https://www.tradeline247ai.com/features"
      />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="hero-section py-20 relative"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "100% auto",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            paddingTop: 'max(env(safe-area-inset-top, 0), 3rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0), 3rem)',
            paddingLeft: 'env(safe-area-inset-left, 0)',
            paddingRight: 'env(safe-area-inset-right, 0)'
          }}
        >
          <div className="hero-gradient-overlay" aria-hidden="true"></div>
          <div className="hero-vignette" aria-hidden="true"></div>
          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="hero-headline text-4xl md:text-6xl font-bold mb-6">
                Powerful Features
              </h1>
              <p className="hero-tagline text-lg md:text-xl mb-8">
                Everything you need for fast and reliable customer interaction automation
              </p>
              <Button size="lg" className="shadow-lg" onClick={handleCTAClick} asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section 
          className="py-20 relative"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "100% auto",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed"
          }}
        >
          <div className="hero-gradient-overlay" aria-hidden="true"></div>
          <div className="hero-vignette" aria-hidden="true"></div>
          <div className="container relative z-10">
            <div className="relative" style={{ border: '3px solid #FF6B35', borderRadius: '12px', padding: '2rem' }}>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1e556b' }}>Powerful Features</h2>
                <p className="text-lg max-w-2xl mx-auto" style={{ color: '#1e556b' }}>
                  Everything you need for fast and reliable customer interaction automation
                </p>
              </div>

              {/* Navy lines connecting title to cards */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                {features.map((_, index) => {
                  const cols = 3;
                  const row = Math.floor(index / cols);
                  const col = index % cols;
                  const cardX = (col + 0.5) * (100 / cols);
                  const cardY = 25 + (row * 35);
                  return (
                    <line
                      key={index}
                      x1="50%"
                      y1="15%"
                      x2={`${cardX}%`}
                      y2={`${cardY}%`}
                      stroke="#1e556b"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.4"
                    />
                  );
                })}
              </svg>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative" style={{ zIndex: 1 }}>
                {features.map((feature, index) => (
                  <div key={index} className="relative">
                    {/* Decorative orbit icon */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FF6B35', border: '3px solid #FF8C35' }}>
                          <feature.icon className="w-8 h-8 text-white" style={{ strokeWidth: '2.5px' }} />
                        </div>
                        {/* Orbital ring */}
                        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ border: '2px solid #FF6B35', transform: 'scale(1.3)' }} />
                      </div>
                    </div>
                    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 pt-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="relative">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4" style={{ border: '2px solid #1e556b' }}>
                          <feature.icon className="w-6 h-6" style={{ color: '#FF6B35', strokeWidth: '2px' }} />
                        </div>
                        <CardTitle className="text-xl" style={{ color: '#1e556b' }}>{feature.title}</CardTitle>
                        <CardDescription className="text-base" style={{ color: '#1e556b' }}>
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: '#1e556b' }}>
                              <CheckCircle className="w-4 h-4 text-[hsl(142,85%,25%)] flex-shrink-0" aria-hidden="true" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-20 relative"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "100% auto",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed"
          }}
        >
          <div className="hero-gradient-overlay" aria-hidden="true"></div>
          <div className="hero-vignette" aria-hidden="true"></div>
          <div className="container text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1e556b' }}>
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using TradeLine 24/7 to grow their customer relationships
            </p>
            <Button size="lg" className="shadow-lg" onClick={handleCTAClick} asChild>
              <Link to="/auth">Grow Now</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;
