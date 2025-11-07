/**
 * Offline Queue for Connector Operations
 * 
 * Queues operations when connectors are unavailable and retries when back online
 */

import { safeStorage } from '@/lib/storage/safeStorage';
export interface QueuedOperation {
  id: string;
  connector: string;
  operation: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const STORAGE_KEY = 'autorepai_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add operation to queue
   */
  enqueue(connector: string, operation: string, payload: Record<string, unknown>): string {
    const id = `${connector}-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOp: QueuedOperation = {
      id,
      connector,
      operation,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
      status: 'pending',
    };

    this.queue.push(queuedOp);
    this.saveToStorage();
    
    return id;
  }

  /**
   * Process queue with retry logic
   */
  async process(executor: (op: QueuedOperation) => Promise<void>) {
    if (this.processing) {
      return;
    }

    this.processing = true;

    const pendingOps = this.queue.filter(op => op.status === 'pending');

    for (const op of pendingOps) {
      try {
        op.status = 'processing';
        this.saveToStorage();

        await executor(op);

        op.status = 'completed';
      } catch (error) {
        op.retries++;
        
        if (op.retries >= op.maxRetries) {
          op.status = 'failed';
          op.error = error instanceof Error ? error.message : 'Unknown error';
        } else {
          op.status = 'pending';
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * op.retries));
        }
      }

      this.saveToStorage();
    }

    this.processing = false;
  }

  /**
   * Get all operations
   */
  getAll(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Get operations by connector
   */
  getByConnector(connector: string): QueuedOperation[] {
    return this.queue.filter(op => op.connector === connector);
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.queue.filter(op => op.status === 'pending').length;
  }

  /**
   * Clear completed operations
   */
  clearCompleted() {
    this.queue = this.queue.filter(op => op.status !== 'completed');
    this.saveToStorage();
  }

  /**
   * Clear all operations
   */
  clearAll() {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Retry failed operations
   */
  retryFailed() {
    this.queue.forEach(op => {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.retries = 0;
        op.error = undefined;
      }
    });
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      const stored = safeStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      // Silent fail - storage quota exceeded or unavailable
    }
  }
}

export const offlineQueue = new OfflineQueue();
