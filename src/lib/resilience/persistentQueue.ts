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

    this.localQueue.set(operationId, op);
    this.saveToLocal();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await db.from('offline_queue').insert({
          user_id: user.id,
          operation: op.operation,
          table_name: op.connector,
          data: op.payload,
          status: op.status,
          retry_count: op.retries,
        });
      }
    } catch (error) {
      // Will sync to DB later
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
      } catch (error) {
        op.retries++;
        op.error_message = error instanceof Error ? error.message : 'Unknown error';
        
        if (op.retries >= op.max_retries) {
          op.status = 'failed';
        } else {
          op.status = 'pending';
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

      const { data: dbOps, error } = await db
        .from('offline_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'syncing']);

      if (error) throw error;

      if (dbOps) {
        for (const dbOp of dbOps) {
          const opId = `${dbOp.table_name}-${dbOp.operation}-${dbOp.id}`;
          if (!this.localQueue.has(opId)) {
            this.localQueue.set(opId, {
              id: dbOp.id,
              operation_id: opId,
              connector: dbOp.table_name,
              operation: dbOp.operation,
              payload: dbOp.data,
              status: dbOp.status === 'syncing' ? 'processing' : dbOp.status,
              retries: dbOp.retry_count,
              max_retries: 3,
              error_message: dbOp.last_error,
              user_id: dbOp.user_id,
              created_at: dbOp.created_at,
              updated_at: dbOp.updated_at,
            });
          }
        }
      }

      for (const op of this.localQueue.values()) {
        await this.updateInDB(op);
      }

      this.saveToLocal();
    } catch (error) {
      // Silent fail, will retry on next sync
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
      
      try {
        await db.from('offline_queue')
          .delete()
          .eq('id', op.id);
      } catch (error) {
        // Will be cleaned up on next sync
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

      const dbStatus = op.status === 'processing' ? 'syncing' : op.status;

      await db.from('offline_queue').upsert({
        id: op.id,
        user_id: user.id,
        operation: op.operation,
        table_name: op.connector,
        data: op.payload,
        status: dbStatus,
        retry_count: op.retries,
        last_error: op.error_message,
        updated_at: op.updated_at,
      });
    } catch (error) {
      // Silent fail
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
      }
    } catch (error) {
      this.localQueue = new Map();
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
      // Storage quota exceeded or unavailable
    }
  }
}

export const persistentQueue = new PersistentQueue();
