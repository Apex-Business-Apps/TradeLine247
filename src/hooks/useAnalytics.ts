import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { errorReporter } from '@/lib/errorReporter';

let analyticsGatedWarningLogged = false;

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url?: string;
}

export const useAnalytics = () => {
  // Generate or get session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('tl247_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tl247_session', sessionId);
    }
    return sessionId;
  }, []);

  // Track analytics event - use secure analytics function due to RLS policies
  const track = useCallback(async (event: AnalyticsEvent) => {
    try {
      const sessionId = getSessionId();
      const pageUrl = event.page_url || window.location.href;

      // Use secure analytics function that has proper permissions
      const { data, error } = await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: event.event_type,
          event_data: event.event_data || {},
          user_session: sessionId,
          page_url: pageUrl,
        }
      });

      if (error) {
        // Analytics may be gated in preview environments
        if (!analyticsGatedWarningLogged) {
          analyticsGatedWarningLogged = true;
          errorReporter.report({
            type: 'error',
            message: `Analytics tracking disabled or gated: ${error.message}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            environment: errorReporter['getEnvironment'](),
            metadata: { error }
          });
        }
      }
    } catch (error) {
      errorReporter.report({
        type: 'error',
        message: `Analytics tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { error }
      });
    }
  }, [getSessionId]);

  // Common tracking functions
  const trackPageView = useCallback((page: string) => {
    track({
      event_type: 'page_view',
      event_data: { page }
    });
  }, [track]);

  const trackButtonClick = useCallback((button_id: string, location?: string) => {
    track({
      event_type: 'button_click',
      event_data: { button_id, location }
    });
  }, [track]);

  const trackFormSubmission = useCallback((form_name: string, success: boolean, data?: any) => {
    track({
      event_type: 'form_submission',
      event_data: { form_name, success, ...data }
    });
  }, [track]);

  const trackConversion = useCallback((conversion_type: string, value?: number, data?: any) => {
    track({
      event_type: 'conversion',
      event_data: { conversion_type, value, ...data }
    });
  }, [track]);

  const trackError = useCallback((error_type: string, error_message: string, context?: any) => {
    track({
      event_type: 'error',
      event_data: { error_type, error_message, context }
    });
  }, [track]);

  return {
    track,
    trackPageView,
    trackButtonClick,
    trackFormSubmission,
    trackConversion,
    trackError,
    getSessionId
  };
};
