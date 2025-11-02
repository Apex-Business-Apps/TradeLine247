import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    _learnq?: Array<any>;
    klaviyo?: any;
  }
}

export const useKlaviyoAnalytics = (companyId?: string) => {
  const location = useLocation();

  useEffect(() => {
    // Initialize Klaviyo if not already loaded
    if (!window._learnq) {
      window._learnq = window._learnq || [];
    }

    // Track page views
    if (window._learnq) {
      window._learnq.push(['track', 'Viewed Page', {
        page: location.pathname,
        title: document.title,
        url: window.location.href
      }]);
    }
  }, [location.pathname]);

  // Return track function for custom events
  const track = (eventName: string, properties?: Record<string, any>) => {
    if (window._learnq) {
      window._learnq.push(['track', eventName, properties]);
    }
  };

  const identify = (email: string, properties?: Record<string, any>) => {
    if (window._learnq) {
      window._learnq.push(['identify', {
        $email: email,
        ...properties
      }]);
    }
  };

  return { track, identify };
};
