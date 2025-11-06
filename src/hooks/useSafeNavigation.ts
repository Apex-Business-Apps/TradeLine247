import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { errorReporter } from '@/lib/errorReporter';

/**
 * Enterprise-grade navigation hook with comprehensive error handling,
 * loading states, route validation, and user feedback.
 * 
 * This hook ensures that all navigation operations are:
 * - Validated before execution
 * - Protected with error handling
 * - Provide user feedback
 * - Logged for debugging
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Validates if a route exists in the application
   */
  const validateRoute = useCallback((path: string): boolean => {
    // Check if path exists in paths object
    const validPaths = Object.values(paths);
    const isValid = validPaths.includes(path as any);
    
    // Also check for dynamic routes (e.g., paths with params)
    if (!isValid) {
      // Allow NotFound route
      if (path === paths.notFound) return true;
      
      // Log in development
      if (import.meta.env.DEV) {
        errorReporter.report({
          type: 'error',
          message: `[Navigation] Route validation failed: ${path}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: { validPaths, attemptedPath: path }
        });
      }
    }
    
    return isValid;
  }, []);

  /**
   * Safe navigation with comprehensive error handling
   */
  const safeNavigate = useCallback(async (
    path: string,
    options?: {
      replace?: boolean;
      state?: any;
      showLoading?: boolean;
      showError?: boolean;
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    const {
      replace = false,
      state,
      showLoading = true,
      showError = true,
      onSuccess,
      onError
    } = options || {};

    // Validate route before navigation
    if (!validateRoute(path)) {
      const error = new Error(`Invalid route: ${path}`);
      errorReporter.report({
        type: 'error',
        message: '[Navigation] Route validation failed',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { path, validRoutes: Object.values(paths) }
      });
      
      if (showError) {
        toast.error('Navigation Error', {
          description: 'The requested page could not be found. Redirecting to dashboard...',
          duration: 3000
        });
      }
      
      onError?.(error);
      
      // Fallback to dashboard for invalid routes
      try {
        setIsNavigating(true);
        navigate(paths.dashboard, { replace: true });
      } catch (fallbackError) {
        errorReporter.report({
          type: 'error',
          message: `[Navigation] Fallback navigation failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment']()
        });
        // Last resort: reload page
        window.location.href = paths.home;
      } finally {
        setIsNavigating(false);
      }
      return;
    }

    try {
      if (showLoading) {
        setIsNavigating(true);
      }

      // Perform navigation
      navigate(path, { replace, state });
      
      // Log successful navigation in development
      if (import.meta.env.DEV) {
        console.log('[Navigation] Success:', {
          path,
          replace,
          timestamp: new Date().toISOString()
        });
      }
      
      onSuccess?.();
    } catch (error) {
      const navError = error instanceof Error 
        ? error 
        : new Error(`Navigation failed: ${path}`);
      
      errorReporter.report({
        type: 'error',
        message: '[Navigation] Navigation error',
        stack: navError.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { path, error: navError.message }
      });
      
      if (showError) {
        toast.error('Navigation Failed', {
          description: 'Unable to navigate to the requested page. Please try again.',
          duration: 4000,
          action: {
            label: 'Retry',
            onClick: () => safeNavigate(path, options)
          }
        });
      }
      
      onError?.(navError);
    } finally {
      if (showLoading) {
        // Small delay to ensure navigation completes
        setTimeout(() => setIsNavigating(false), 100);
      }
    }
  }, [navigate, validateRoute]);

  /**
   * Navigate to a path with automatic error handling
   */
  const goTo = useCallback((path: string, options?: Parameters<typeof safeNavigate>[1]) => {
    return safeNavigate(path, options);
  }, [safeNavigate]);

  /**
   * Navigate with immediate error feedback
   */
  const goToWithFeedback = useCallback((path: string, label?: string) => {
    return safeNavigate(path, {
      showLoading: true,
      showError: true,
      onError: (error) => {
        errorReporter.report({
          type: 'error',
          message: `[Navigation] Failed to navigate to ${label || path}`,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: { label, path }
        });
      }
    });
  }, [safeNavigate]);

  return {
    navigate: safeNavigate,
    goTo,
    goToWithFeedback,
    isNavigating,
    validateRoute
  };
}








