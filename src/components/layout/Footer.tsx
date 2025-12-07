import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <address className="not-italic text-sm">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src="/apex-logo.png"
                  alt="APEX Business Systems"
                  className="h-5 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
                <strong>Apex Business Systems</strong>
              </div>
              <div className="text-muted-foreground">
                Edmonton, Alberta • Built Canadian<br />
                <a href="mailto:info@tradeline247ai.com" className="hover:text-foreground transition-colors" style={{ color: '#FF6B35' }}>info@tradeline247ai.com</a>
              </div>
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
        <div className="mt-10 border-t border-slate-200/60 dark:border-slate-700/60 pt-8 pb-6">
          <div className="flex flex-col items-center gap-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:justify-center sm:gap-12">
            {/* TDA backed by Alberta Innovates */}
            <div className="flex flex-col items-center gap-2 text-center group">
              <span className="uppercase tracking-wider text-[0.65rem] font-medium text-muted-foreground">
                TDA Backed by
              </span>
              <a
                href="https://albertainnovates.ca/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center transition-opacity hover:opacity-80"
              >
                <img
                  src="/alberta-innovates.png"
                  alt="Alberta Innovates"
                  className="h-7 w-auto max-w-[140px]"
                />
              </a>
            </div>

            {/* ERIN membership */}
            <div className="flex flex-col items-center gap-2 text-center group">
              <span className="uppercase tracking-wider text-[0.65rem] font-medium text-muted-foreground">
                Member of
              </span>
              <a
                href="https://www.edmontonrin.ca/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center transition-opacity hover:opacity-80"
              >
                <img
                  src="/erin-logo.svg"
                  alt="Edmonton Regional Innovation Network (ERIN)"
                  className="h-12 w-auto max-w-[180px]"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
