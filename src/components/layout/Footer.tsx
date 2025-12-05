import React from 'react';
import { Logo } from '@/components/ui/logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Logo variant="text" size="sm" />
            </div>
            <address className="not-italic text-sm">
              <strong>Apex Business Systems</strong> • Edmonton, Alberta • Built Canadian<br />
              <a href="mailto:info@tradeline247ai.com" className="hover:text-foreground transition-colors" style={{ color: '#FF6B35' }}>info@tradeline247ai.com</a>
            </address>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
              <span>© 2025 <span style={{ color: '#FF6B35' }}>TradeLine 24/7</span>. Never miss a call. We got it.</span>
            </div>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <a 
              href="/security" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </a>
            <a 
              href="/compare" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare
            </a>
            <a 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a 
              href="mailto:info@tradeline247ai.com" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Ecosystem partners / trust strip */}
        <div className="mt-10 border-t border-slate-200 pt-6 pb-8">
          <div className="flex flex-col items-center gap-4 text-xs text-slate-500 sm:flex-row sm:justify-center sm:gap-10">
            {/* TDA backed by Alberta Innovates */}
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="uppercase tracking-wide text-[0.7rem]">
                TDA Backed by
              </span>
              <a
                href="https://albertainnovates.ca/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center"
              >
                <img
                  src="/alberta-innovates.svg"
                  alt="Alberta Innovates"
                  className="h-6 w-auto"
                />
              </a>
            </div>

            {/* ERIN membership */}
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="uppercase tracking-wide text-[0.7rem]">
                Member of
              </span>
              <a
                href="https://www.edmontonrin.ca/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center"
              >
                <img
                  src="/erin-logo.svg"
                  alt="Edmonton Regional Innovation Network (ERIN)"
                  className="h-10 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
