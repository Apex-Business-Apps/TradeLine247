import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js';
import { errorReporter } from '@/lib/errorReporter';

interface RealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

interface DataWithId {
  id: string | number;
}

export function useRealtimeData<T>(
  initialData: T[],
  options: RealtimeOptions
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    table,
    schema = 'public',
    filter,
    event = '*'
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isCleanedUp = false;

    const setupRealtime = async () => {
      try {
        // Prevent setup if already cleaned up (race condition protection)
        if (isCleanedUp) return;

        channel = supabase
          .channel(`realtime-${table}-${Date.now()}`) // Unique channel name to prevent conflicts
          .on(
            'postgres_changes' as any,
            {
              event,
              schema,
              table,
              filter
            },
            (payload: RealtimePayload<T>) => {
              // Ignore updates if component unmounted
              if (isCleanedUp) return;

              switch (payload.eventType) {
                case 'INSERT':
                  setData(prev => [...prev, payload.new]);
                  break;
                case 'UPDATE':
                  setData(prev =>
                    prev.map(item => {
                      const itemWithId = item as unknown as DataWithId;
                      const newWithId = payload.new as unknown as DataWithId;
                      return itemWithId.id === newWithId.id ? payload.new : item;
                    })
                  );
                  break;
                case 'DELETE':
                  setData(prev =>
                    prev.filter(item => {
                      const itemWithId = item as unknown as DataWithId;
                      const oldWithId = payload.old as unknown as DataWithId;
                      return itemWithId.id !== oldWithId.id;
                    })
                  );
                  break;
              }
            }
          )
          .subscribe((status) => {
            // Ignore status updates if component unmounted
            if (isCleanedUp) return;

            console.log('Realtime subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');

            if (status === 'CHANNEL_ERROR') {
              setError(new Error('Realtime connection failed'));
            } else {
              setError(null);
            }
          });
      } catch (err) {
        errorReporter.report({
          type: 'error',
          message: `Realtime setup error: ${err instanceof Error ? err.message : String(err)}`,
          stack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment']()
        });

        if (!isCleanedUp) {
          setError(err instanceof Error ? err : new Error('Unknown realtime error'));
        }
      }
    };

    setupRealtime();

    return () => {
      // Mark as cleaned up to prevent race conditions
      isCleanedUp = true;

      // Properly unsubscribe and remove channel
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
        channel = null;
      }

      // Reset connection state on cleanup
      setIsConnected(false);
    };
  }, [table, schema, filter, event]);

  const updateData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    isConnected,
    error,
    updateData
  };
}

// Hook for realtime appointment updates
export function useRealtimeAppointments(orgId: string) {
  return useRealtimeData([], {
    table: 'appointments',
    filter: `organization_id=eq.${orgId}`,
    event: '*'
  });
}

// Hook for realtime analytics events
export function useRealtimeAnalytics() {
  return useRealtimeData([], {
    table: 'analytics_events',
    event: 'INSERT'
  });
}
