/**
 * Offline Queue for Connector Operations
 * 
 * Queues operations when connectors are unavailable and retries when back online
 */

export interface QueuedOperation {
  id: string;
  connector: string;
  operation: string;
  payload: any;
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
  enqueue(connector: string, operation: string, payload: any): string {
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
    
    console.log(`[OfflineQueue] Enqueued ${connector}.${operation} (${id})`);
    
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
    
    console.log(`[OfflineQueue] Processing ${pendingOps.length} operations`);

    for (const op of pendingOps) {
      try {
        op.status = 'processing';
        this.saveToStorage();

        await executor(op);

        op.status = 'completed';
        console.log(`[OfflineQueue] Completed ${op.connector}.${op.operation} (${op.id})`);
      } catch (error) {
        op.retries++;
        
        if (op.retries >= op.maxRetries) {
          op.status = 'failed';
          op.error = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[OfflineQueue] Failed ${op.connector}.${op.operation} after ${op.retries} retries`);
        } else {
          op.status = 'pending';
          console.warn(`[OfflineQueue] Retry ${op.retries}/${op.maxRetries} for ${op.connector}.${op.operation}`);
          
          // Wait before next retry
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} operations from storage`);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save to storage:', error);
    }
  }
}

export const offlineQueue = new OfflineQueue();
