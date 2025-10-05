/**
 * React Hook for Offline Data Synchronization
 * 
 * Manages sync state and provides methods for syncing data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { persistentQueue } from '@/lib/resilience/persistentQueue';

// Type helper for new tables until types are regenerated
const db = supabase as any;

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
  }, []);

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
      // Sync persistent queue
      await persistentQueue.sync();

      // Process pending operations
      await persistentQueue.process(async (op) => {
        // Execute the operation based on connector
        console.log(`[OfflineSync] Processing ${op.connector}.${op.operation}`);
        // Actual execution logic would go here
      });

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingCount: persistentQueue.getPendingCount(),
      }));
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
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
    entityType: string,
    entityId: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await db.from('sync_state').upsert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        last_synced_at: new Date().toISOString(),
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('[OfflineSync] Failed to update sync state:', error);
    }
  }, []);

  /**
   * Check if entity needs sync
   */
  const needsSync = useCallback(async (
    entityType: string,
    entityId: string,
    maxAge: number = 300000 // 5 minutes default
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;

      const { data, error } = await db
        .from('sync_state')
        .select('last_synced_at')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error || !data) return true;

      const lastSync = new Date(data.last_synced_at).getTime();
      const now = Date.now();
      
      return now - lastSync > maxAge;
    } catch (error) {
      console.error('[OfflineSync] Failed to check sync state:', error);
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
