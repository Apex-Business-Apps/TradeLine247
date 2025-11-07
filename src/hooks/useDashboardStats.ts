/**
 * Dashboard Statistics Hook
 *
 * Fetches real-time dashboard metrics with proper error handling and UX
 *
 * UX Design Principles Applied:
 * - Progressive loading with skeleton states
 * - Error recovery with retry mechanism
 * - Stale-while-revalidate for perceived performance
 * - Auto-refresh for real-time feel
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  activeLeads: number;
  totalVehicles: number;
  totalQuotes: number;
  conversionRate: number;
  // Trend data for sparklines (future enhancement)
  trends?: {
    leadsChange: number;
    vehiclesChange: number;
    quotesChange: number;
    conversionChange: number;
  };
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Parallel queries for optimal performance
        const [leadsRes, vehiclesRes, quotesRes] = await Promise.all([
          supabase
            .from('leads')
            .select('id, status', { count: 'exact' }),
          supabase
            .from('vehicles')
            .select('id', { count: 'exact' }),
          supabase
            .from('quotes')
            .select('id, status', { count: 'exact' }),
        ]);

        // Check for errors with user-friendly messages
        if (leadsRes.error) throw new Error('Failed to load leads data');
        if (vehiclesRes.error) throw new Error('Failed to load vehicle data');
        if (quotesRes.error) throw new Error('Failed to load quotes data');

        // Calculate metrics
        const activeLeads = leadsRes.data?.filter(l =>
          ['new', 'contacted', 'qualified'].includes(l.status)
        ).length || 0;

        const totalQuotes = quotesRes.data?.length || 0;
        const acceptedQuotes = quotesRes.data?.filter(q =>
          q.status === 'accepted'
        ).length || 0;

        const conversionRate = totalQuotes > 0
          ? Math.round((acceptedQuotes / totalQuotes) * 100)
          : 0;

        return {
          activeLeads,
          totalVehicles: vehiclesRes.count || 0,
          totalQuotes,
          conversionRate,
        };
      } catch (error) {
        // Re-throw with context for error boundary
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard statistics. Please try again.'
        );
      }
    },
    // UX-optimized caching strategy
    staleTime: 30000, // Consider data fresh for 30s
    refetchInterval: 60000, // Auto-refresh every minute
    refetchOnWindowFocus: true, // Refresh when user returns
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
