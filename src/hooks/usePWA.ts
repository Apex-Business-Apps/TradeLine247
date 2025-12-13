import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPrompt: () => Promise<void>;
}

const PWA_DISMISSAL_KEY = 'tl247:pwa-dismissed';
const PWA_DISMISSAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isPWADismissed(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const dismissed = localStorage.getItem(PWA_DISMISSAL_KEY);
  if (!dismissed) return false;
  const dismissedTime = parseInt(dismissed, 10);
  const now = Date.now();
  return (now - dismissedTime) < PWA_DISMISSAL_DURATION_MS;
}

function setPWADismissed(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(PWA_DISMISSAL_KEY, Date.now().toString());
}

export const usePWA = (): UsePWAReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUserGesture, setHasUserGesture] = useState(false);

  useEffect(() => {
    // Guard: Only run in browser environment with matchMedia support
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed (14-day cooldown)
    if (isPWADismissed()) {
      return;
    }

    // Listen for user gesture (click, touch, keydown) to enable install prompt
    const handleUserGesture = () => {
      setHasUserGesture(true);
      // If prompt is already available, enable installable
      if (deferredPrompt) {
        setIsInstallable(true);
      }
    };

    const gestureEvents = ['click', 'touchstart', 'keydown'];
    gestureEvents.forEach(event => {
      window.addEventListener(event, handleUserGesture, { once: true, passive: true });
    });

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only set installable if user has already interacted (user gesture gate)
      if (hasUserGesture) {
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      gestureEvents.forEach(event => {
        window.removeEventListener(event, handleUserGesture);
      });
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, hasUserGesture]);

  const showInstallPrompt = async () => {
    // Gate: Only show after user gesture
    if (!hasUserGesture) {
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      // Only call prompt() inside user gesture handler (click)
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
        // Persist dismissal for 14 days
        setPWADismissed();
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  return {
    isInstallable: isInstallable && hasUserGesture,
    isInstalled,
    showInstallPrompt,
  };
};
