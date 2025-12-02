import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { isInstallable, isIOS, promptInstall, dismissPrompt } = usePWAInstall();

  if (!isInstallable && !isIOS) return null;

  if (isIOS) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#1a2b4a] text-white p-4 z-50 shadow-lg"
        data-testid="pwa-install-ios"
      >
        <div className="flex items-start justify-between max-w-md mx-auto">
          <div className="flex-1">
            <p className="font-semibold">Install TradeLine 24/7</p>
            <p className="text-sm opacity-90 mt-1">
              Tap <Share className="inline h-4 w-4 mx-1" /> then "Add to Home Screen"
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismissPrompt}
            className="text-white hover:bg-white/20"
            aria-label="Dismiss install prompt"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#1a2b4a] text-white p-4 z-50 shadow-lg"
      data-testid="pwa-install"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex-1">
          <p className="font-semibold">Install TradeLine 24/7</p>
          <p className="text-sm opacity-90">Never miss a call. Work while you sleep.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissPrompt}
            className="text-white hover:bg-white/20"
          >
            Not now
          </Button>
          <Button
            onClick={promptInstall}
            size="sm"
            className="bg-[#e55a2b] hover:bg-[#d14a1b] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
