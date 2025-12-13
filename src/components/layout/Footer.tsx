import React from "react";
import { Download } from "lucide-react";

import albertaInnovatesLogo from "@/assets/logos/alberta-innovates.png";
import erinLogo from "@/assets/logos/erin.png";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const navLinks = [
  { href: "/security", label: "Security" },
  { href: "/compare", label: "Compare" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:info@tradeline247ai.com", label: "Contact" },
];

const partners = [
  {
    title: "Backed by Alberta Innovates",
    alt: "Alberta Innovates logo",
    logo: albertaInnovatesLogo,
  },
  {
    title: "ERIN Research Partner",
    alt: "ERIN partner logo",
    logo: erinLogo,
    chip: true,
  },
  {
    title: "Powered by OpenAI",
    alt: "OpenAI logo",
    logo: "/assets/brand/badges/openai-logo.png",
  },
  {
    title: "Payments by Stripe",
    alt: "Stripe logo",
    logo: "/assets/brand/badges/stripe-logo.png",
  },
  {
    title: "Infrastructure on Vercel",
    alt: "Vercel logo",
    logo: "/assets/brand/badges/vercel-logo.png",
  },
];

export const Footer: React.FC = () => {
  const { isInstallable, isInstalled, showInstallPrompt } = usePWA();

  return (
    <footer className="mt-auto border-t bg-background" role="contentinfo">
      <div className="container space-y-10 py-10">
        <div className="grid gap-8 lg:gap-12 md:grid-cols-[1.2fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo variant="text" size="sm" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              TradeLine 24/7 keeps operators responsive day and night. Purpose-built for Canadian businesses that refuse
              to miss revenue opportunities.
            </p>
            <address className="not-italic text-sm leading-relaxed text-muted-foreground space-y-1">
              <div className="text-foreground font-semibold">Apex Business Systems • Edmonton, Alberta</div>
              <a
                href="mailto:info@tradeline247ai.com"
                className="font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                info@tradeline247ai.com
              </a>
            </address>
            <div className="flex flex-wrap items-center gap-3">
              {isInstallable && !isInstalled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showInstallPrompt}
                  className="text-sm"
                  aria-label="Install TradeLine 24/7 app"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Install App
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                © 2025 <span className="font-semibold text-foreground">TradeLine 24/7</span>. Never miss a call.
              </span>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Navigate</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Partners</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {partners.map((partner) => (
                <div
                  key={partner.title}
                  className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 shadow-sm transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  data-testid="trust-badge"
                  tabIndex={0}
                >
                  <div
                    className={`flex h-12 w-16 items-center justify-center rounded-md bg-white/80 p-1 shadow-inner ${
                      partner.chip ? "ring-1 ring-primary/10 bg-primary/5" : ""
                    }`}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.alt}
                      className="max-h-10 w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-semibold leading-tight text-foreground">{partner.title}</div>
                    <div className="text-xs text-muted-foreground">Ecosystem partner</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
