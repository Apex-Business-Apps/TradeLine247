/**
 * Circuit Breaker Pattern for Connector Resilience
 * 
 * Protects against cascading failures when external systems are down
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private metrics: CircuitMetrics = { failures: 0, successes: 0 };
  private nextAttempt: number = Date.now();
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 60 seconds
      resetTimeout: 30000, // 30 seconds
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
      }
      this.state = 'HALF_OPEN';
      console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.metrics.successes++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      if (this.metrics.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.metrics.failures = 0;
        this.metrics.successes = 0;
        console.log(`[CircuitBreaker:${this.name}] Transitioning to CLOSED`);
      }
    } else if (this.state === 'CLOSED') {
      this.metrics.failures = 0;
    }
  }

  private onFailure() {
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();
    this.metrics.successes = 0;

    if (this.metrics.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      console.error(
        `[CircuitBreaker:${this.name}] Transitioning to OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}`
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitMetrics & { state: CircuitState } {
    return { ...this.metrics, state: this.state };
  }

  reset() {
    this.state = 'CLOSED';
    this.metrics = { failures: 0, successes: 0 };
    this.nextAttempt = Date.now();
    console.log(`[CircuitBreaker:${this.name}] Manual reset to CLOSED`);
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  reset(name: string) {
    this.breakers.get(name)?.reset();
  }

  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();
