import React from 'react';
import { useLocation } from 'react-router-dom';
import { errorReporter } from '@/lib/errorReporter';
import { useRouteValidator } from '@/hooks/useRouteValidator';

export const RouteValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isValid, suggestedRedirect } = useRouteValidator();
  
  // Log route access for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    if (!isValid) {
      errorReporter.report({
        type: 'error',
        message: `Accessing invalid route: ${location.pathname}. Suggested: ${suggestedRedirect}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { invalidPath: location.pathname, suggestedRedirect }
      });
    } else {
      console.log(`Valid route accessed: ${location.pathname}`);
    }
  }
  
  return <>{children}</>;
};
