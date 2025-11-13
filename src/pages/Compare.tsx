import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

const comparisonData = [
  { feature: "Answering Model", tradeline: "AI-powered", smithAI: "Human agents", smithAIBot: "AI assistant", ruby: "Human agents", callrail: "AI assist", notes: "Type of service" },
  { feature: "Availability", tradeline: "24/7/365", smithAI: "24/7", smithAIBot: "24/7", ruby: "24/7", callrail: "Business hours+", notes: "Coverage hours" },
  { feature: "Pricing Style", tradeline: "Flat monthly", smithAI: "Per-call/minute", smithAIBot: "Per-call", ruby: "Per-call/minute", callrail: "Per-minute", notes: "Billing approach" },
  { feature: "Multilingual", tradeline: "Yes", smithAI: "Limited", smithAIBot: "Yes", ruby: "Spanish available", callrail: "Limited", notes: "Language support" },
  { feature: "Data Ownership", tradeline: "Customer-owned", smithAI: "Customer-owned", smithAIBot: "Customer-owned", ruby: "Customer-owned", callrail: "Customer-owned", notes: "Who owns call data" },
];

export default function Compare() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple title/description to avoid SEOHead until we’re stable */}
      <main className="flex-1">
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
          <div className="container text-center relative z-10">
            <h1 className="hero-headline text-4xl md:text-6xl font-bold mb-6">
              TradeLine 24/7 vs Alternatives
            </h1>
            <p className="hero-tagline text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              Compare features, pricing, and capabilities across leading answering service providers.
            </p>
          </div>
        </section>

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
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl md:text-3xl" style={{ color: '#1e556b' }}>Provider Comparison</CardTitle>
                  <CardDescription style={{ color: '#1e556b' }}>Key features across TradeLine 24/7, Smith.ai, Ruby, and CallRail</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 min-w-[120px]" style={{ color: '#1e556b' }}>Feature</th>
                          <th className="text-center py-3 px-2 min-w-[100px]" style={{ backgroundColor: '#E55A2B' }}>
                            <Badge className="mb-1 text-xs" style={{ backgroundColor: '#E55A2B', color: 'white' }}>TradeLine 24/7</Badge>
                          </th>
                          <th className="text-center py-3 px-2 min-w-[100px]" style={{ color: '#1e556b' }}>Smith.ai (Human)</th>
                          <th className="text-center py-3 px-2 min-w-[100px]" style={{ color: '#1e556b' }}>Smith.ai (AI)</th>
                          <th className="text-center py-3 px-2 min-w-[100px]" style={{ color: '#1e556b' }}>Ruby</th>
                          <th className="text-center py-3 px-2 min-w-[100px]" style={{ color: '#1e556b' }}>CallRail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium" style={{ color: '#1e556b' }}>
                              {row.feature}
                              <div className="text-xs mt-0.5" style={{ color: '#1e556b', opacity: 0.7 }}>{row.notes}</div>
                            </td>
                            <td className="text-center py-3 px-2" style={{ backgroundColor: '#E55A2B' }}>
                              <span className="font-semibold text-xs" style={{ color: 'white' }}>{row.tradeline}</span>
                            </td>
                            <td className="text-center py-3 px-2"><span className="text-xs" style={{ color: '#1e556b' }}>{row.smithAI}</span></td>
                            <td className="text-center py-3 px-2"><span className="text-xs" style={{ color: '#1e556b' }}>{row.smithAIBot}</span></td>
                            <td className="text-center py-3 px-2"><span className="text-xs" style={{ color: '#1e556b' }}>{row.ruby}</span></td>
                            <td className="text-center py-3 px-2"><span className="text-xs" style={{ color: '#1e556b' }}>{row.callrail}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground italic text-center">
                    * Figures and features change; confirm details on vendor websites.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

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
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Why Choose TradeLine 24/7?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Flat monthly pricing with unlimited calls and true 24/7 AI-powered coverage.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link className="inline-flex items-center rounded-md px-6 py-3 bg-primary text-primary-foreground hover:opacity-90" to="/pricing">
                  View Pricing
                </Link>
                <Link className="inline-flex items-center rounded-md px-6 py-3 border border-input hover:bg-accent" to="/demo">
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
