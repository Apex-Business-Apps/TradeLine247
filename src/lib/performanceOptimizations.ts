/**
 * Performance Optimizations Utility
 * Ensures all UX enhancements remain performant and regression-free
 */

/**
 * Debounce function to limit expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           document.documentElement.classList.contains('reduce-motion');
  } catch {
    return false;
  }
}

/**
 * Safe animation frame request (respects reduced motion)
 */
export function safeRequestAnimationFrame(callback: () => void): number | null {
  if (prefersReducedMotion()) {
    callback();
    return null;
  }
  return requestAnimationFrame(callback);
}

/**
 * Optimized scroll handler with throttling
 */
export function createOptimizedScrollHandler(
  callback: () => void,
  throttleMs: number = 16
): EventListener {
  return throttle(callback, throttleMs) as EventListener;
}

/**
 * Check if element is in viewport (for lazy animations)
 */
export function isInViewport(element: Element, threshold: number = 0.1): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -rect.height * threshold &&
      rect.left >= -rect.width * threshold &&
      rect.bottom <= windowHeight + rect.height * threshold &&
      rect.right <= windowWidth + rect.width * threshold
    );
  } catch {
    return false;
  }
}

/**
 * Lazy load intersection observer (single instance for performance)
 */
let intersectionObserver: IntersectionObserver | null = null;

export function getIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }
  return intersectionObserver;
}

/**
 * Cleanup intersection observer
 */
export function cleanupIntersectionObserver(): void {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

/**
 * Performance monitoring (lightweight)
 */
export function measurePerformance(name: string, fn: () => void): void {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch DOM updates
 */
export function batchUpdates(callback: () => void): void {
  if (typeof requestAnimationFrame !== 'undefined' && typeof window !== 'undefined') {
    requestAnimationFrame(callback);
  } else {
    // Fallback for test environment or SSR
    if (typeof setTimeout !== 'undefined') {
      setTimeout(callback, 0);
    } else {
      // Synchronous fallback (should not happen in normal runtime)
      callback();
    }
  }
}

