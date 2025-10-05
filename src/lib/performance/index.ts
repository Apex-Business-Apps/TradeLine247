/**
 * Performance Optimization Library
 * Centralized exports for all performance utilities
 */

export { RateLimiter, apiRateLimiter, chatRateLimiter, emailRateLimiter } from './rateLimiter';
export type { RateLimitConfig } from './rateLimiter';

export { requestDeduplicator } from './requestDeduplicator';
export { BatchProcessor } from './batchProcessor';

export {
  createOptimizedImage,
  preloadImage,
  preloadImages,
  generatePlaceholder,
  observeImageLoad,
} from './imageOptimizer';
export type { ImageLoadOptions } from './imageOptimizer';

export {
  MemoryManager,
  createCleanupManager,
  WeakCache,
  logMemoryUsage,
} from './memoryManager';
