/**
 * Memory Management Utilities
 * Helps prevent memory leaks and manage resource cleanup
 */

export class MemoryManager {
  private resources = new Set<() => void>();

  /**
   * Register a cleanup function
   */
  register(cleanup: () => void): void {
    this.resources.add(cleanup);
  }

  /**
   * Unregister a cleanup function
   */
  unregister(cleanup: () => void): void {
    this.resources.delete(cleanup);
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    this.resources.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('[MemoryManager] Cleanup error:', error);
      }
    });
    this.resources.clear();
  }

  /**
   * Get number of registered resources
   */
  size(): number {
    return this.resources.size;
  }
}

/**
 * Hook for automatic cleanup on component unmount
 */
export function createCleanupManager(): MemoryManager {
  return new MemoryManager();
}

/**
 * Weak reference cache for preventing memory leaks
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Monitor memory usage (for debugging)
 */
export function logMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('[Memory]', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
    });
  }
}
