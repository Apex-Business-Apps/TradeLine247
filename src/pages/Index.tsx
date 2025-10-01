import { Button } from '@/components/ui/button';
import { Sparkles, CarFront, UsersRound, Rocket, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
              AutoRepAi
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The world's most advanced dealership AI platform. Automate leads, quotes, 
              credit apps, and customer communication with enterprise-grade compliance.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth">
                  Get Started
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/dashboard">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UsersRound className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Lead Management</h3>
            <p className="text-muted-foreground">
              Intelligent lead capture, scoring, and automated follow-ups
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CarFront className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Quoting</h3>
            <p className="text-muted-foreground">
              Canadian tax calculations, F&I products, and secure sharing
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Credit Apps</h3>
            <p className="text-muted-foreground">
              FCRA-compliant applications with automated decisioning
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
            <p className="text-muted-foreground">
              E2EE, CASL/TCPA/GDPR compliance, full audit trails
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
