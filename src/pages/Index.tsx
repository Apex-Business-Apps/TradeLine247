import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CarFront, UsersRound, Rocket, ShieldCheck, ArrowRight, TrendingUp, Zap, Award, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Bold Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center animate-fade-in">
            <Badge className="mb-6 text-sm px-4 py-2" variant="outline">
              <Sparkles className="w-3 h-3 mr-2" />
              AI-Powered Dealership Platform
            </Badge>
            
            <img 
              src={logo} 
              alt="AutoAi Logo" 
              className="w-40 h-40 mx-auto mb-8 animate-scale-in hover-scale"
            />
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Close More Deals.<br />
              Work Less.
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Transform your dealership with AI that automates leads, quotes, and credit applications while ensuring enterprise-grade compliance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 border-2">
                <Link to="/dashboard">
                  View Live Demo
                  <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
      </div>

      {/* Social Proof Stats */}
      <div className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Leads Processed</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-primary mb-2">3x</div>
              <div className="text-sm text-muted-foreground">Faster Processing</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to Scale
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features built for modern dealerships
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/50 group">
            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UsersRound className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Lead Management</h3>
            <p className="text-muted-foreground mb-4">
              Intelligent lead capture, scoring, and automated follow-ups that convert.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/50 group">
            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CarFront className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Quoting</h3>
            <p className="text-muted-foreground mb-4">
              Canadian tax calculations, F&I products, and instant secure sharing.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/50 group">
            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Credit Apps</h3>
            <p className="text-muted-foreground mb-4">
              FCRA-compliant applications with automated decisioning in seconds.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/50 group">
            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
            <p className="text-muted-foreground mb-4">
              E2EE, CASL/TCPA/GDPR compliance with full audit trails included.
            </p>
            <Link to="/dashboard" className="text-primary font-medium inline-flex items-center hover:gap-2 transition-all">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">3x Revenue Growth</h3>
              <p className="text-muted-foreground">
                Dealerships using AutoAi see an average 3x increase in closed deals within the first quarter.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">10x Faster Process</h3>
              <p className="text-muted-foreground">
                Automate repetitive tasks and reduce manual work by 90% with intelligent AI workflows.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Industry Leading</h3>
              <p className="text-muted-foreground">
                Trusted by top dealerships for reliability, compliance, and cutting-edge AI technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Transform Your Dealership?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join leading dealerships using AI to close more deals, automate workflows, and scale effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg">
              <Link to="/auth">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 border-2">
              <Link to="/dashboard">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Free 14-day trial • No credit card required • Setup in minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
