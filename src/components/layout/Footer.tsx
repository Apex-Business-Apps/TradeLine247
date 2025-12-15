import React from "react";
import { Download } from "lucide-react";

import albertaInnovatesLogo from "@/assets/logos/alberta-innovates.png";
import erinLogo from "@/assets/logos/erin.png";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

// Idempotent constants: configuration data that doesn't change
const CONTACT_EMAIL = "info@tradeline247ai.com";
const COMPANY_NAME = "Apex Business Systems";
const COMPANY_LOCATION = "Edmonton, Alberta";
const COPYRIGHT_YEAR = 2025;

const navLinks = [
  { href: "/security", label: "Security" },
  { href: "/compare", label: "Compare" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
] as const;

type PartnerLogo = string | typeof albertaInnovatesLogo | typeof erinLogo;

interface Partner {
  title: string;
  alt: string;
  logo: PartnerLogo;
  chip?: boolean;
}

const partners: Partner[] = [
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
] as const;

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
              <div className="text-foreground font-semibold">
                {COMPANY_NAME} • {COMPANY_LOCATION}
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CONTACT_EMAIL}
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
                © {COPYRIGHT_YEAR}{" "}
                <span className="font-semibold text-foreground">TradeLine 24/7</span>. Never miss a call.
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
            <div className="flex flex-wrap gap-2">
              {partners.map((partner) => (
                <div
                  key={partner.title}
                  className="group flex h-12 items-center gap-2 rounded-lg border border-border/70 bg-muted/50 px-2 py-1.5 shadow-sm transition-colors hover:bg-muted"
                  data-testid="trust-badge"
                  title={partner.title}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded bg-white/80 p-1 ${
                      partner.chip ? "ring-1 ring-primary/10 bg-primary/5" : ""
                    }`}
                    role="img"
                    aria-label={partner.alt}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.alt}
                      className="h-6 w-6 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {partner.title.split(" ").slice(-1)[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
