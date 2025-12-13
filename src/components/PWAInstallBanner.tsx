import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { installPWA, getPWAPrompt } from '@/lib/pwaInstall';

const PWA_DISMISSAL_KEY = 'tl247:pwa-banner-dismissed';
const PWA_DISMISSAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isBannerDismissed(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const dismissed = localStorage.getItem(PWA_DISMISSAL_KEY);
  if (!dismissed) return false;
  const dismissedTime = parseInt(dismissed, 10);
  const now = Date.now();
  return (now - dismissedTime) < PWA_DISMISSAL_DURATION_MS;
}

function setBannerDismissed(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(PWA_DISMISSAL_KEY, Date.now().toString());
}

export const PWAInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(!isBannerDismissed());

  useEffect(() => {
    // Check dismissal on mount
    if (isBannerDismissed()) {
      setIsVisible(false);
    }
  }, []);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setBannerDismissed();
    setIsVisible(false);
  };

  if (!isVisible || !getPWAPrompt()) return null;

  return (
    <Card 
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 border-0"
      style={{ 
        boxShadow: 'var(--shadow-elegant)',
        background: 'linear-gradient(135deg, hsl(var(--card) / 0.98) 0%, hsl(var(--card) / 0.95) 100%)'
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Install TradeLine 24/7</h3>
              <p className="text-xs text-muted-foreground">Get faster access from your home screen</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-muted"
            aria-label="Dismiss install prompt"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1"
          >
            Install
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
