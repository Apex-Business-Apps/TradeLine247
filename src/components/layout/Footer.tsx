import React from "react";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

// PNG-only partner logos (NO WebP)
import albertaLogoPng from "@/assets/logos/alberta-innovates.png";
import erinLogoPng from "@/assets/logos/erin.png";

type FooterLink = { label: string; href: string; external?: boolean };

function FooterLinkItem({ label, href, external }: FooterLink) {
  return (
    <li>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accentStrong/40"
      >
        {label}
        {external ? (
          <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
        ) : null}
      </a>
    </li>
  );
}

function FooterGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <FooterLinkItem key={`${l.href}-${l.label}`} {...l} />
        ))}
      </ul>
    </div>
  );
}

function PartnerLogo({
  href,
  name,
  src,
  wrapClassName,
  imgClassName,
}: {
  href: string;
  name: string;
  src: string;
  wrapClassName?: string;
  imgClassName?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={name}
      title={name}
      className={
        wrapClassName ??
        "flex h-14 min-w-[200px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 px-5 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accentStrong/40"
      }
    >
      <img
        src={src}
        alt={name}
        className={imgClassName ?? "h-8 w-auto object-contain"}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}

export function Footer() {
  const product: FooterLink[] = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "/security" },
    { label: "Docs", href: "/docs" },
  ];

  const solutions: FooterLink[] = [
    { label: "Trades", href: "/solutions/trades" },
    { label: "Clinics", href: "/solutions/clinics" },
    { label: "Drivers", href: "/solutions/drivers" },
    { label: "Agencies", href: "/solutions/agencies" },
  ];

  const company: FooterLink[] = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Status", href: "/status" },
  ];

  const legal: FooterLink[] = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Accessibility", href: "/accessibility" },
  ];

  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand + contact */}
          <div className="max-w-xl">
            <div className="text-lg font-extrabold tracking-tight text-foreground">
              TradeLine <span className="opacity-90">24/7</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Never miss a call. Work while you sleep. TradeLine 24/7 answers instantly,
              qualifies leads, and delivers clean transcripts—so you can focus on the work.
            </p>

            <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a
                  href="mailto:hello@apexbusinesssystems.ca"
                  className="rounded-sm hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accentStrong/40"
                >
                  hello@apexbusinesssystems.ca
                </a>
              </div>

              <div className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <a
                  href="tel:+1-587-742-8885"
                  className="rounded-sm hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accentStrong/40"
                >
                  +1 (587) 742-8885
                </a>
              </div>

              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Edmonton, Alberta • Serving Canada</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <FooterGroup title="Product" links={product} />
            <FooterGroup title="Solutions" links={solutions} />
            <FooterGroup title="Company" links={company} />
            <FooterGroup title="Legal" links={legal} />
          </div>
        </div>

        {/* Partner logos */}
        <div className="mt-10 border-t border-border pt-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Supported by
          </p>

          {/* Mobile: horizontal scroll. Desktop: wrap. */}
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
            <PartnerLogo
              href="https://albertainnovates.ca/"
              name="Alberta Innovates"
              src={albertaLogoPng}
              wrapClassName="flex h-14 min-w-[230px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 px-5 hover:bg-muted/50"
              imgClassName="h-7 w-auto object-contain"
            />

            {/* ERIN includes fine text: keep it larger so it stays legible */}
            <PartnerLogo
              href="https://www.edmontonrin.ca/"
              name="Edmonton Regional Innovation Network (ERIN)"
              src={erinLogoPng}
              wrapClassName="flex h-16 min-w-[250px] shrink-0 items-center justify-center rounded-xl border border-border bg-brand-navy/10 dark:bg-brand-navy/35 px-5 hover:bg-brand-navy/15 dark:hover:bg-brand-navy/45"
              imgClassName="h-10 w-auto object-contain"
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Partner marks are displayed as provided (no recolor, no distortion).
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} APEX Business Systems Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
