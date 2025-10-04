/**
 * Image Optimization Utilities
 * Provides lazy loading, placeholder generation, and optimization helpers
 */

export interface ImageLoadOptions {
  src: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Creates an optimized image element with lazy loading
 */
export function createOptimizedImage(options: ImageLoadOptions): HTMLImageElement {
  const img = new Image();
  
  img.src = options.src;
  img.alt = options.alt;
  img.loading = options.loading || 'lazy';
  img.decoding = options.decoding || 'async';
  
  if (options.onLoad) {
    img.addEventListener('load', options.onLoad);
  }
  
  if (options.onError) {
    img.addEventListener('error', options.onError);
  }
  
  return img;
}

/**
 * Preloads critical images for better LCP
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preloads multiple images in parallel
 */
export async function preloadImages(sources: string[]): Promise<void> {
  await Promise.all(sources.map(src => preloadImage(src)));
}

/**
 * Generate a placeholder for lazy loaded images
 */
export function generatePlaceholder(width: number, height: number): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f3f4f6' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}

/**
 * Intersection Observer for lazy loading
 */
export function observeImageLoad(
  img: HTMLImageElement,
  callback: () => void
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  observer.observe(img);
  return observer;
}
