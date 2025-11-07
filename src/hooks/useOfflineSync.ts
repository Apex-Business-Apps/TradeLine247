/**
 * React Hook for Offline Data Synchronization
 * 
 * Manages sync state and provides methods for syncing data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { persistentQueue } from '@/lib/resilience/persistentQueue';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type helper for new tables until types are regenerated
const db = supabase as SupabaseClient;

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  isOnline: boolean;
  error: string | null;
}

export function useOfflineSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    pendingCount: 0,
    isOnline: navigator.onLine,
    error: null,
  });

  /**
   * Manually trigger sync
   */
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncState(prev => ({
        ...prev,
        error: 'Cannot sync while offline'
      }));
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await persistentQueue.sync();

      await persistentQueue.process(async (op) => {
        // Execute the operation - implementation depends on operation type
        // This is handled by the persistent queue processor
      });

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingCount: persistentQueue.getPendingCount(),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      syncNow(); // Auto-sync when coming back online
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = () => {
      const count = persistentQueue.getPendingCount();
      setSyncState(prev => ({ ...prev, pendingCount: count }));
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Clear completed operations
   */
  const clearCompleted = useCallback(async () => {
    await persistentQueue.clearCompleted();
    setSyncState(prev => ({
      ...prev,
      pendingCount: persistentQueue.getPendingCount(),
    }));
  }, []);

  /**
   * Retry failed operations
   */
  const retryFailed = useCallback(() => {
    persistentQueue.retryFailed();
    setSyncState(prev => ({
      ...prev,
      pendingCount: persistentQueue.getPendingCount(),
    }));
  }, []);

  /**
   * Update sync state for entity
   */
  const updateSyncState = useCallback(async (
    tableName: string,
    metadata?: Record<string, unknown>
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    await db.from('sync_state').upsert({
      user_id: user.id,
      table_name: tableName,
      last_sync_at: new Date().toISOString(),
      metadata: metadata || {},
    });
  }, []);

  /**
   * Check if entity needs sync
   */
  const needsSync = useCallback(async (
    tableName: string,
    maxAge: number = 300000 // 5 minutes default
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;

      const { data, error } = await db
        .from('sync_state')
        .select('last_sync_at')
        .eq('user_id', user.id)
        .eq('table_name', tableName)
        .single();

      if (error || !data) return true;

      const lastSync = new Date(data.last_sync_at).getTime();
      const now = Date.now();
      
      return now - lastSync > maxAge;
    } catch (error) {
      return true;
    }
  }, []);

  return {
    syncState,
    syncNow,
    clearCompleted,
    retryFailed,
    updateSyncState,
    needsSync,
  };
}
