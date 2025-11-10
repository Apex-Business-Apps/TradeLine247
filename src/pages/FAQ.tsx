import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

const faqs = [
  {
    question: "Do you record calls?",
    answer: "Yes. Only with notice and consent. You can opt out anytime."
  },
  {
    question: "How do transcripts work?",
    answer: "After each call, a short summary goes to your inbox with next steps."
  },
  {
    question: "Is this compliant in Canada?",
    answer: "Yes. Every message identifies us and includes an unsubscribe. We honour requests within 10 business days."
  },
  {
    question: "Can you handle complex customer inquiries?",
    answer: "Yes, we handle a wide range of inquiries from simple questions to complex requests. For situations requiring human help, we transfer to your team with full context."
  },
  {
    question: "What integrations are available?",
    answer: "We integrate with popular CRMs (Salesforce, HubSpot, Pipedrive), email platforms (Outlook, Gmail), messaging apps (WhatsApp, Slack, Teams), phone systems (Twilio, Vonage), and many other business tools through our API."
  },
  {
    question: "Is my customer data secure?",
    answer: "Yes. We're SOC 2 compliant with bank-level security. All data is encrypted and we follow strict GDPR and privacy rules. Your data is never shared with third parties."
  },
  {
    question: "How quickly can I get started?",
    answer: "About 10 minutes. Most accounts go live the same day with your current number. No number porting required to start."
  },
  {
    question: "Can I customize the responses?",
    answer: "Yes, you can fully customize your service's personality, responses, and workflows. Set custom greetings, FAQ responses, and business-specific information to match your brand voice."
  },
  {
    question: "What languages are supported?",
    answer: "We support over 50 languages with native-level fluency. The system can automatically detect the customer's language and respond appropriately."
  },
  {
    question: "Can I try before I buy?",
    answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. Our team will help you set up and test the system."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="FAQ - TradeLine 24/7 AI Receptionist Questions"
        description="Get answers to common questions about TradeLine 24/7 AI receptionist service. Learn about setup, integrations, pricing, security and more."
        keywords="AI receptionist FAQ, customer service automation questions, business phone answering help"
        canonical="https://www.tradeline247ai.com/faq"
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
          <div className="container text-center relative z-10">
            <h1 className="hero-headline text-4xl md:text-6xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="hero-tagline text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              Everything you need to know about TradeLine 24/7 AI receptionist service
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
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
            <div className="relative" style={{ border: '3px solid #FF6B35', borderRadius: '12px', padding: '2rem', maxWidth: '4xl', margin: '0 auto' }}>
              <Card className="max-w-4xl mx-auto border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl text-center" style={{ color: '#1e556b' }}>Common Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left" style={{ color: '#1e556b' }}>
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent style={{ color: '#1e556b' }}>
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#1e556b' }}>
              Still Have Questions?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#1e556b' }}>
              Our team is here to help. Get in touch and we'll answer any questions about TradeLine 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="shadow-lg" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section 
          className="py-16 relative"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div style={{ border: '2px solid #FF6B35', borderRadius: '8px', padding: '1.5rem' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#FF6B35' }}>99.9%</div>
                  <div style={{ color: '#1e556b' }}>Uptime Guarantee</div>
                </div>
                <div style={{ border: '2px solid #FF6B35', borderRadius: '8px', padding: '1.5rem' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#FF6B35' }}>10 min</div>
                  <div style={{ color: '#1e556b' }}>Setup Time</div>
                </div>
                <div style={{ border: '2px solid #FF6B35', borderRadius: '8px', padding: '1.5rem' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#FF6B35' }}>50+</div>
                  <div style={{ color: '#1e556b' }}>Languages Supported</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ;
