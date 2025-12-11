import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorReporter } from '@/lib/errorReporter';

export const RATE_LIMIT_ERROR_MESSAGE = 'Rate limit exceeded. Please try again later.';

interface SecureSubmissionOptions {
  rateLimitKey?: string;
  maxAttemptsPerHour?: number;
}

export const useSecureFormSubmission = (options: SecureSubmissionOptions = {}) => {
  const { rateLimitKey, maxAttemptsPerHour = 5 } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(maxAttemptsPerHour);

  const checkRateLimit = async (): Promise<boolean> => {
    if (!rateLimitKey) return true;

    const limitForRequest = currentLimit || maxAttemptsPerHour;

    try {
      // Use server-side rate limiting via RPC function
      const { data, error } = await supabase.rpc('secure_rate_limit', {
        identifier: rateLimitKey,
        max_requests: limitForRequest,
        window_seconds: 3600
      });

      if (error) {
        errorReporter.report({
          type: 'error',
          message: `Rate limit check error: ${error.message}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: { rateLimitKey, error }
        });
        setAttempts(limitForRequest);
        // Fail closed - deny on error to prevent bypass
        return false;
      }

      // Parse the response - RPC returns Json type
      const result = data as { allowed: boolean; remaining: number; limit: number };
      const limit = result?.limit ?? limitForRequest;
      const remaining = typeof result?.remaining === 'number' ? result.remaining : limit;

      const normalizedRemaining = Math.max(0, Math.min(limit, remaining));

      setCurrentLimit(limit);

      if (!result?.allowed) {
        const attemptsUsed = limit - normalizedRemaining;

        setAttempts(Math.min(limit, Math.max(0, attemptsUsed || limit)));

        errorReporter.report({
          type: 'error',
          message: `Rate limit exceeded for: ${rateLimitKey}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: { rateLimitKey, remaining: result.remaining, limit: result.limit }
        });
        return false;
      }

      setAttempts(Math.min(limit, Math.max(0, limit - normalizedRemaining)));
      return true;
    } catch (error) {
      errorReporter.report({
        type: 'error',
        message: `Rate limit check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { rateLimitKey, error }
      });
      setAttempts(limitForRequest);
      // Fail closed - deny on error to prevent bypass
      return false;
    }
  };

  const getCSRFToken = (): string => {
    // Generate a CSRF token if none exists
    let token = sessionStorage.getItem('csrf-token');
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem('csrf-token', token);
    }
    return token;
  };

  const secureSubmit = async <T>(
    endpoint: string,
    data: any,
    options: { 
      validateResponse?: (response: any) => boolean;
      sanitizeData?: (data: any) => any;
    } = {}
  ): Promise<T> => {
    const rateLimitPassed = await checkRateLimit();
    if (!rateLimitPassed) {
      // Surface a consistent error message for callers and tests
      throw new Error(RATE_LIMIT_ERROR_MESSAGE);
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize data if function provided
      const sanitizedData = options.sanitizeData ? options.sanitizeData(data) : data;
      
      // Add CSRF token
      const submissionData = {
        ...sanitizedData,
        _csrf: getCSRFToken(),
        _timestamp: Date.now()
      };

      const { data: response, error } = await supabase.functions.invoke(endpoint, {
        body: submissionData,
        headers: {
          'X-CSRF-Token': getCSRFToken(),
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(error.message || 'Submission failed');
      }

      // Validate response if function provided
      if (options.validateResponse && !options.validateResponse(response)) {
        throw new Error('Invalid response received');
      }

      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRemainingAttempts = (): number => {
    return Math.max(0, currentLimit - attempts);
  };

  return {
    isSubmitting,
    secureSubmit,
    checkRateLimit,
    getRemainingAttempts,
    attempts
  };
};
