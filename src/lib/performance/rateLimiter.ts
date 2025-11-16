/**
 * Token Bucket Rate Limiter
 * Prevents request flooding and ensures fair resource usage
 */

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // ms
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimitConfig;
  private refillTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
    this.startRefilling();
  }

  private startRefilling() {
    this.refillTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      const tokensToAdd = (elapsed / 1000) * this.config.refillRate;
      
      this.tokens = Math.min(
        this.config.maxTokens,
        this.tokens + tokensToAdd
      );
      this.lastRefill = now;
    }, this.config.refillInterval);
  }

  tryConsume(tokens: number = 1): boolean {
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getAvailableTokens(): number {
    return Math.floor(this.tokens);
  }

  reset() {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
  }

  destroy() {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
  }

  /**
   * Cleanup method to ensure proper resource cleanup
   * Should be called when rate limiter is no longer needed
   */
  cleanup() {
    this.destroy();
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
  maxTokens: 100,
  refillRate: 10, // 10 requests per second
  refillInterval: 100,
});

export const chatRateLimiter = new RateLimiter({
  maxTokens: 20,
  refillRate: 2, // 2 messages per second
  refillInterval: 500,
});

export const emailRateLimiter = new RateLimiter({
  maxTokens: 10,
  refillRate: 1, // 1 email per second
  refillInterval: 1000,
});

export { RateLimiter };
export type { RateLimitConfig };
