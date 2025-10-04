/**
 * Request Deduplicator
 * Prevents duplicate requests from being sent simultaneously
 * Improves performance and reduces server load
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly timeout = 30000; // 30 seconds

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    options: { ttl?: number } = {}
  ): Promise<T> {
    const ttl = options.ttl || this.timeout;
    
    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      const age = Date.now() - pending.timestamp;
      if (age < ttl) {
        console.log(`[Dedup] Reusing pending request for key: ${key}`);
        return pending.promise;
      } else {
        // Request is too old, remove it
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = fn()
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, 100);
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }

  getStats() {
    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    };
  }
}

export const requestDeduplicator = new RequestDeduplicator();
