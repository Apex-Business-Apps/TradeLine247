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
    title: "Advanced AI Receptionist",
    description: "Emotionally intelligent AI with 6 emotion recognition categories, adaptive responses, and human-like conversations",
    benefits: ["Emotional intelligence", "Personality customization", "Natural dialogue flow", "Context awareness", "Multi-language support"]
  },
  {
    icon: Phone,
    title: "Enterprise Booking System",
    description: "Complete booking workflow with secure credit card commitment, calendar integration, and automated confirmations",
    benefits: ["Secure payment processing", "Calendar sync (Google/Outlook)", "Automated confirmations", "Booking analytics", "Escalation protocols"]
  },
  {
    icon: MessageSquare,
    title: "Intelligent Call Management",
    description: "Advanced call routing, real-time transcription, and comprehensive analytics with enterprise monitoring",
    benefits: ["Smart call routing", "Real-time transcription", "Call analytics dashboard", "Priority handling", "Quality monitoring"]
  },
  {
    icon: Zap,
    title: "Complete Business Automation",
    description: "Seamless integration with CRMs, calendars, payment systems, and custom business workflows",
    benefits: ["CRM integration", "Calendar synchronization", "Payment processing", "Custom workflows", "API-first architecture"]
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Military-grade security with SOC 2 Type II, PCI DSS compliance, and comprehensive audit trails",
    benefits: ["SOC 2 Type II compliant", "PCI DSS certified", "GDPR compliant", "Multi-layered protection", "Real-time monitoring"]
  },
  {
    icon: Clock,
    title: "24/7 Enterprise Monitoring",
    description: "99.9% uptime SLA with real-time health checks, automated alerting, and comprehensive analytics",
    benefits: ["99.9% uptime SLA", "Real-time monitoring", "Automated alerting", "Performance analytics", "Incident response"]
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
        title="Enterprise Features - TradeLine 24/7 AI Receptionist Platform"
        description="Discover enterprise-grade AI receptionist features: advanced booking system, emotional intelligence, calendar integration, secure payments, and 99.9% uptime SLA. Complete business automation solution."
        keywords="enterprise AI receptionist, advanced booking system, emotional intelligence AI, calendar integration, secure payment processing, enterprise security, SOC 2 compliance, PCI DSS, business automation"
        canonical="https://www.tradeline247ai.com/features"
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
              <div className="container">
                <div className="text-center max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent  text-foreground">
                    Enterprise-Grade Features
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8">
                    Complete business automation with AI receptionist, advanced booking system, and enterprise security
                  </p>
                  <Button size="lg" className="shadow-lg" onClick={handleCTAClick} asChild>
                    <Link to="/auth">Start Free Trial</Link>
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Features Grid */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
              <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="relative">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-[hsl(142,85%,25%)] flex-shrink-0" aria-hidden="true" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* CTA Section */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
              <div className="container text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
          </div>
        </div>
        
        <div className="bg-background/85 backdrop-blur-[2px]">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Features;
