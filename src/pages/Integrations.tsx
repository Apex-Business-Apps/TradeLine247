import React from 'react';
import { IntegrationsGrid } from '@/components/dashboard/IntegrationsGrid';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Integrations() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Integrations - TradeLine 24/7"
        description="Connect TradeLine 24/7 with your favorite tools and services. CRM, email, phone, messaging, mobile, and automation integrations."
        keywords="integrations, CRM, email, phone, messaging, mobile, automation, API"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Integrations
              </h1>
              <p className="text-muted-foreground text-lg">
                Connect TradeLine 24/7 with your existing tools and workflows
              </p>
            </div>
          </div>

          <IntegrationsGrid />
        </div>
      </div>
    </>
  );
}
