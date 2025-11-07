/**
 * Leads Data Hook
 *
 * Fetches real-time leads data with proper error handling and UX
 *
 * UX Design Principles Applied:
 * - Progressive loading with skeleton states
 * - Error recovery with retry mechanism
 * - Stale-while-revalidate for perceived performance
 * - Auto-refresh for real-time feel
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  dealership_id: string;
  assigned_to: string | null;
  source: string;
  status: string;
  score: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: string | null;
  vehicle_interest: string | null;
  trade_in: any | null;
  notes: string | null;
  metadata: any | null;
  created_at: string;
  updated_at: string;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
}

export function useLeads() {
  return useQuery<LeadsResponse>({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        // Fetch all leads ordered by creation date (newest first)
        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error('Failed to load leads data');
        }

        return {
          leads: data || [],
          total: count || 0,
        };
      } catch (error) {
        // Re-throw with context for error boundary
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Unable to load leads. Please try again.'
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
