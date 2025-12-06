import React from 'react';
import { Logo } from '@/components/ui/logo';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const navLinks = [
  { href: '/security', label: 'Security' },
  { href: '/compare', label: 'Compare' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: 'mailto:info@tradeline247ai.com', label: 'Contact' },
];

const trustBadges = [
  {
    title: 'Backed by Alberta Innovates',
    alt: 'Alberta Innovates logo',
    logo: '/alberta-innovates.svg',
    abbreviation: 'AI',
  },
  {
    title: 'Powered by OpenAI',
    alt: 'OpenAI logo',
    logo: '/assets/brand/badges/openai-logo.png',
    abbreviation: 'OA',
  },
  {
    title: 'Payments by Stripe',
    alt: 'Stripe logo',
    logo: '/assets/brand/badges/stripe-logo.png',
    abbreviation: 'S',
  },
  {
    title: 'Infrastructure on Vercel',
    alt: 'Vercel logo',
    logo: '/assets/brand/badges/vercel-logo.png',
    abbreviation: 'V',
  },
];

export const Footer: React.FC = () => {
  const { isInstallable, isInstalled, showInstallPrompt } = usePWA();

  return (
    <footer className="border-t bg-background mt-auto" role="contentinfo">
      <div className="container py-8 md:py-10 space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Logo variant="text" size="sm" />
            </div>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Apex Business Systems</strong> • Edmonton, Alberta • Built Canadian<br />
              <a
                href="mailto:info@tradeline247ai.com"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                info@tradeline247ai.com
              </a>
            </address>
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="text-primary font-semibold">TradeLine 24/7</span>. Never miss a call. We got it.
            </p>
          </div>

          {/* Apex Business Systems Logo - Center */}
          <div className="hidden md:flex items-center justify-center">
            <img
              src="/assets/brand/apex-logo.svg"
              alt="Apex Business Systems"
              className="h-12 w-auto object-contain"
              loading="lazy"
            />
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-sm text-muted-foreground">
            {isInstallable && !isInstalled && (
              <Button
                variant="outline"
                size="sm"
                onClick={showInstallPrompt}
                className="text-sm"
                aria-label="Install TradeLine 24/7 app"
              >
                <Download className="w-4 h-4 mr-1" />
                Install App
              </Button>
            )}
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-border/70 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {trustBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2 shadow-sm max-w-[220px] overflow-hidden"
                data-testid="trust-badge"
              >
                {badge.logo ? (
                  <img
                    src={badge.logo}
                    alt={badge.alt}
                    className="h-8 w-auto object-contain flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase text-muted-foreground flex-shrink-0"
                    aria-label={badge.alt}
                  >
                    {badge.abbreviation}
                  </div>
                )}
                <div className="text-left min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight text-foreground truncate">{badge.title}</div>
                  <div className="text-xs text-muted-foreground">Ecosystem partner</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
