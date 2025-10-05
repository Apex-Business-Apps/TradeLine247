/**
 * Batch Processor
 * Batches multiple operations together to reduce overhead
 * Useful for database operations, analytics events, etc.
 */

interface BatchConfig<T> {
  maxBatchSize: number;
  maxWaitTime: number; // ms
  processor: (items: T[]) => Promise<void>;
}

export class BatchProcessor<T> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private config: BatchConfig<T>;
  private processing = false;

  constructor(config: BatchConfig<T>) {
    this.config = config;
  }

  add(item: T): void {
    this.queue.push(item);

    // Process immediately if batch is full
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
    } else {
      // Schedule processing if not already scheduled
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.config.maxWaitTime);
      }
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0 || this.processing) {
      return;
    }

    this.processing = true;
    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.config.processor(batch);
    } catch (error) {
      console.error('[BatchProcessor] Error processing batch:', error);
      // Re-add failed items to queue for retry
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
  }
}
