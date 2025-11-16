import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CarFront, UsersRound, Rocket, ShieldCheck, ArrowRight, TrendingUp, Zap, Award, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROICalculator } from '@/components/Growth/ROICalculator';
import { Header } from '@/components/Layout/Header';
import { Logo } from '@/components/ui/logo';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main role="main">
      {/* Bold Hero Section with Red Accent */}
      <section className="relative overflow-hidden bg-black text-white" aria-label="Hero">
        {/* Red accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center animate-fade-in">
            <Badge className="mb-6 text-sm px-4 py-2 bg-primary text-white border-primary">
              <Sparkles className="w-3 h-3 mr-2" />
              AI-Powered Dealership Platform
            </Badge>
            
            <Logo className="w-40 h-40 mx-auto mb-8 animate-scale-in hover-scale" />
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-white">
              Close More Deals.<br />
              <span className="text-primary">Work Less.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Transform your dealership with AI that automates leads, quotes, and credit applications while ensuring enterprise-grade compliance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all">
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 border-2 border-white text-primary hover:bg-white hover:text-black">
                <Link to="/dashboard">
                  View Live Demo
                  <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-border bg-white" aria-label="Statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-black">Leads Processed</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-black">Customer Satisfaction</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-primary mb-2">3x</div>
              <div className="text-sm text-black">Faster Processing</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-black">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white" aria-label="Features">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
            Everything You Need to <span className="text-primary">Scale</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features built for modern dealerships
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 hover:shadow-lg transition-all border-2 border-border hover:border-primary group bg-white">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UsersRound className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">AI Lead Management</h3>
            <p className="text-gray-600 mb-4">
              Intelligent lead capture, scoring, and automated follow-ups that convert.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 border-border hover:border-primary group bg-white">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CarFront className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Smart Quoting</h3>
            <p className="text-gray-600 mb-4">
              Canadian tax calculations, F&I products, and instant secure sharing.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 border-border hover:border-primary group bg-white">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Instant Credit Apps</h3>
            <p className="text-gray-600 mb-4">
              FCRA-compliant applications with automated decisioning in seconds.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 border-border hover:border-primary group bg-white">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Enterprise Security</h3>
            <p className="text-gray-600 mb-4">
              E2EE, CASL/TCPA/GDPR compliance with full audit trails included.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <div className="bg-gradient-to-b from-white to-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-sm px-4 py-2 bg-primary text-white border-primary">
              <TrendingUp className="w-3 h-3 mr-2" />
              Calculate Your ROI
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
              See Your Potential <span className="text-primary">Revenue Growth</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find out how much more revenue your dealership could generate with AutoRepAi
            </p>
          </div>
          <ROICalculator />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">3x Revenue Growth</h3>
              <p className="text-gray-300">
                Dealerships using AutoAi see an average 3x increase in closed deals within the first quarter.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">10x Faster Process</h3>
              <p className="text-gray-300">
                Automate repetitive tasks and reduce manual work by 90% with intelligent AI workflows.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Industry Leading</h3>
              <p className="text-gray-300">
                Trusted by top dealerships for reliability, compliance, and cutting-edge AI technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden bg-primary">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Dealership?
          </h2>
          <p className="text-xl text-white mb-10 max-w-2xl mx-auto">
            Join leading dealerships using AI to close more deals, automate workflows, and scale effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-black text-white hover:bg-black/90 shadow-lg">
              <Link to="/auth">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 border-2 border-white bg-white text-primary hover:bg-white/90">
              <Link to="/dashboard">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-white mt-6">
            Free 14-day trial • No credit card required • Setup in minutes
          </p>
        </div>
      </div>
      </main>
    </div>
  );
};

export default Index;
