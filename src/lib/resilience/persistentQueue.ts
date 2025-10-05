/**
 * Enhanced Offline Queue with Database Persistence
 * 
 * Syncs with Supabase for cross-device offline operation management
 */

import { supabase } from '@/integrations/supabase/client';
import { safeStorage } from '@/lib/storage/safeStorage';

// Type helper for new tables until types are regenerated
const db = supabase as any;

export interface PersistentOperation {
  id: string;
  operation_id: string;
  connector: string;
  operation: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  max_retries: number;
  error_message?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

const LOCAL_STORAGE_KEY = 'autorepai_persistent_queue';
const SYNC_INTERVAL = 30000; // 30 seconds

export class PersistentQueue {
  private localQueue: Map<string, PersistentOperation> = new Map();
  private syncTimer?: number;
  private isSyncing = false;

  constructor() {
    this.loadFromLocal();
    this.startSync();
  }

  /**
   * Enqueue an operation
   */
  async enqueue(connector: string, operation: string, payload: any): Promise<string> {
    const operationId = `${connector}-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const op: PersistentOperation = {
      id: crypto.randomUUID(),
      operation_id: operationId,
      connector,
      operation,
      payload,
      status: 'pending',
      retries: 0,
      max_retries: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store locally first
    this.localQueue.set(operationId, op);
    this.saveToLocal();

      // Try to persist to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await db.from('offline_queue').insert({
            operation_id: op.operation_id,
            connector: op.connector,
            operation: op.operation,
            payload: op.payload,
            status: op.status,
            retries: op.retries,
            max_retries: op.max_retries,
            user_id: user.id,
          });
        }
      } catch (error) {
        console.warn('[PersistentQueue] Failed to persist to DB, will retry on sync:', error);
      }

    return operationId;
  }

  /**
   * Process all pending operations
   */
  async process(executor: (op: PersistentOperation) => Promise<void>): Promise<void> {
    const pending = Array.from(this.localQueue.values())
      .filter(op => op.status === 'pending')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const op of pending) {
      try {
        op.status = 'processing';
        op.updated_at = new Date().toISOString();
        this.saveToLocal();
        await this.updateInDB(op);

        await executor(op);

        op.status = 'completed';
        op.completed_at = new Date().toISOString();
        op.updated_at = new Date().toISOString();
        console.log(`[PersistentQueue] Completed ${op.operation_id}`);
      } catch (error) {
        op.retries++;
        op.error_message = error instanceof Error ? error.message : 'Unknown error';
        
        if (op.retries >= op.max_retries) {
          op.status = 'failed';
          console.error(`[PersistentQueue] Failed ${op.operation_id} after ${op.retries} retries`);
        } else {
          op.status = 'pending';
          console.warn(`[PersistentQueue] Retry ${op.retries}/${op.max_retries} for ${op.operation_id}`);
        }
        
        op.updated_at = new Date().toISOString();
      }

      this.saveToLocal();
      await this.updateInDB(op);
    }
  }

  /**
   * Sync local queue with database
   */
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from database
      const { data: dbOps, error } = await db
        .from('offline_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);

      if (error) throw error;

      // Merge with local queue
      if (dbOps) {
        for (const dbOp of dbOps) {
          if (!this.localQueue.has(dbOp.operation_id)) {
            this.localQueue.set(dbOp.operation_id, {
              id: dbOp.id,
              operation_id: dbOp.operation_id,
              connector: dbOp.connector,
              operation: dbOp.operation,
              payload: dbOp.payload,
              status: dbOp.status,
              retries: dbOp.retries,
              max_retries: dbOp.max_retries,
              error_message: dbOp.error_message,
              user_id: dbOp.user_id,
              created_at: dbOp.created_at,
              updated_at: dbOp.updated_at,
              completed_at: dbOp.completed_at,
            });
          }
        }
      }

      // Push local changes to database
      for (const op of this.localQueue.values()) {
        await this.updateInDB(op);
      }

      this.saveToLocal();
    } catch (error) {
      console.error('[PersistentQueue] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get all operations
   */
  getAll(): PersistentOperation[] {
    return Array.from(this.localQueue.values());
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return Array.from(this.localQueue.values())
      .filter(op => op.status === 'pending').length;
  }

  /**
   * Clear completed operations
   */
  async clearCompleted(): Promise<void> {
    const completed = Array.from(this.localQueue.entries())
      .filter(([_, op]) => op.status === 'completed');

    for (const [opId, op] of completed) {
      this.localQueue.delete(opId);
      
      // Delete from database
      try {
        await db.from('offline_queue')
          .delete()
          .eq('operation_id', op.operation_id);
      } catch (error) {
        console.warn('[PersistentQueue] Failed to delete from DB:', error);
      }
    }

    this.saveToLocal();
  }

  /**
   * Retry failed operations
   */
  retryFailed(): void {
    for (const op of this.localQueue.values()) {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.retries = 0;
        op.error_message = undefined;
        op.updated_at = new Date().toISOString();
      }
    }
    this.saveToLocal();
  }

  /**
   * Start periodic sync
   */
  private startSync(): void {
    this.syncTimer = window.setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL);

    // Initial sync
    this.sync();
  }

  /**
   * Stop periodic sync
   */
  stopSync(): void {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
    }
  }

  /**
   * Update operation in database
   */
  private async updateInDB(op: PersistentOperation): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await db.from('offline_queue').upsert({
        id: op.id,
        operation_id: op.operation_id,
        connector: op.connector,
        operation: op.operation,
        payload: op.payload,
        status: op.status,
        retries: op.retries,
        max_retries: op.max_retries,
        error_message: op.error_message,
        user_id: user.id,
        updated_at: op.updated_at,
        completed_at: op.completed_at,
      });
    } catch (error) {
      console.warn('[PersistentQueue] Failed to update DB:', error);
    }
  }

  /**
   * Load from local storage
   */
  private loadFromLocal(): void {
    try {
      const stored = safeStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const ops: PersistentOperation[] = JSON.parse(stored);
        for (const op of ops) {
          this.localQueue.set(op.operation_id, op);
        }
        console.log(`[PersistentQueue] Loaded ${ops.length} operations from local storage`);
      }
    } catch (error) {
      console.error('[PersistentQueue] Failed to load from local storage:', error);
    }
  }

  /**
   * Save to local storage
   */
  private saveToLocal(): void {
    try {
      const ops = Array.from(this.localQueue.values());
      safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ops));
    } catch (error) {
      console.error('[PersistentQueue] Failed to save to local storage:', error);
    }
  }
}

export const persistentQueue = new PersistentQueue();
