/**
 * Lovable Save & Publish Failsafe System
 * 
 * Comprehensive failsafe and contingency system for Lovable integration
 * Handles save failures, network issues, permission problems, and publishing errors
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Multiple save strategies (direct, queue, batch)
 * - Health monitoring and diagnostics
 * - Graceful degradation
 * - Error recovery and reporting
 */

import { reportError } from './reportError';

export interface SaveAttempt {
  id: string;
  timestamp: number;
  data: unknown;
  retries: number;
  strategy: SaveStrategy;
  status: 'pending' | 'success' | 'failed' | 'retrying';
}

export type SaveStrategy = 'direct' | 'queue' | 'batch' | 'fallback';

interface FailsafeConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  queueSize: number;
  batchIntervalMs: number;
  healthCheckIntervalMs: number;
  enableFallback: boolean;
}

const DEFAULT_CONFIG: FailsafeConfig = {
  maxRetries: 5,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  queueSize: 50,
  batchIntervalMs: 5000,
  healthCheckIntervalMs: 30000,
  enableFallback: true,
};

class LovableSaveFailsafe {
  private config: FailsafeConfig;
  private saveQueue: SaveAttempt[] = [];
  private pendingSaves = new Map<string, SaveAttempt>();
  private healthCheckInterval: number | null = null;
  private batchInterval: number | null = null;
  private isHealthy = true;
  private consecutiveFailures = 0;
  private lastSuccessTime = Date.now();

  constructor(config: Partial<FailsafeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  private initialize() {
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start batch processing
    this.startBatchProcessing();
    
    // Restore queued saves from localStorage (if any)
    this.restoreQueue();
    
    // Listen for online/offline events
    this.setupNetworkListeners();
    
    // Listen for visibility changes (tab focus)
    this.setupVisibilityListeners();
    
    console.log('[Lovable Failsafe] Initialized with config:', this.config);
  }

  /**
   * Save with automatic retry and fallback strategies
   */
  async save(data: unknown, strategy: SaveStrategy = 'direct'): Promise<boolean> {
    const attemptId = this.generateAttemptId();
    const attempt: SaveAttempt = {
      id: attemptId,
      timestamp: Date.now(),
      data,
      retries: 0,
      strategy,
      status: 'pending',
    };

    try {
      // Try direct save first
      if (strategy === 'direct' || strategy === 'fallback') {
        const success = await this.attemptDirectSave(attempt);
        if (success) {
          this.recordSuccess();
          return true;
        }
      }

      // Queue for batch processing if direct save fails
      if (strategy === 'queue' || strategy === 'batch') {
        this.queueSave(attempt);
        return true; // Return true because it's queued
      }

      // Retry with exponential backoff
      return await this.retrySave(attempt);
    } catch (error) {
      console.error('[Lovable Failsafe] Save failed:', error);
      this.recordFailure();
      
      // Queue for later retry
      this.queueSave(attempt);
      
      // Report error
      reportError(error, 'lovable-save-failsafe');
      
      return false;
    }
  }

  /**
   * Attempt direct save to Lovable/GitHub
   */
  private async attemptDirectSave(attempt: SaveAttempt): Promise<boolean> {
    try {
      // Check if we're in a healthy state
      if (!this.isHealthy && attempt.retries === 0) {
        console.warn('[Lovable Failsafe] System unhealthy, queuing save');
        return false;
      }

      // Check if Lovable is available
      const isLovableAvailable = this.checkLovableAvailability();
      if (!isLovableAvailable) {
        console.warn('[Lovable Failsafe] Lovable not available, queuing save');
        return false;
      }

      // Attempt save through Lovable API
      const success = await this.executeLovableSave(attempt.data);
      
      if (success) {
        attempt.status = 'success';
        this.pendingSaves.delete(attempt.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Lovable Failsafe] Direct save attempt failed:', error);
      return false;
    }
  }

  /**
   * Execute save through Lovable API
   */
  private async executeLovableSave(data: unknown): Promise<boolean> {
    try {
      // Check if we're in Lovable environment
      const isLovableEnv = this.isLovableEnvironment();
      if (!isLovableEnv) {
        console.warn('[Lovable Failsafe] Not in Lovable environment, skipping save');
        return false;
      }

      // Try to save via Lovable's save mechanism
      // This would integrate with Lovable's actual save API
      const saveFunction = (window as any).lovable?.save;
      if (saveFunction && typeof saveFunction === 'function') {
        await saveFunction(data);
        return true;
      }

      // Fallback: Try GitHub API directly
      return await this.fallbackGitHubSave(data);
    } catch (error) {
      console.error('[Lovable Failsafe] Execute save failed:', error);
      return false;
    }
  }

  /**
   * Fallback: Save directly to GitHub API
   */
  private async fallbackGitHubSave(data: unknown): Promise<boolean> {
    try {
      // This would require GitHub token and proper API integration
      // For now, we'll log and queue the save
      console.warn('[Lovable Failsafe] GitHub fallback not fully implemented, queuing save');
      return false;
    } catch (error) {
      console.error('[Lovable Failsafe] GitHub fallback failed:', error);
      return false;
    }
  }

  /**
   * Retry save with exponential backoff
   */
  private async retrySave(attempt: SaveAttempt): Promise<boolean> {
    if (attempt.retries >= this.config.maxRetries) {
      console.error('[Lovable Failsafe] Max retries reached for attempt:', attempt.id);
      attempt.status = 'failed';
      this.queueSave(attempt); // Queue for manual retry later
      return false;
    }

    attempt.retries++;
    attempt.status = 'retrying';

    const delay = Math.min(
      this.config.retryDelayMs * Math.pow(2, attempt.retries - 1),
      this.config.maxRetryDelayMs
    );

    console.log(`[Lovable Failsafe] Retrying save ${attempt.id} (attempt ${attempt.retries}/${this.config.maxRetries}) in ${delay}ms`);

    await this.sleep(delay);

    // Try again with different strategy
    const newStrategy = this.getNextStrategy(attempt.strategy);
    return await this.save(attempt.data, newStrategy);
  }

  /**
   * Get next strategy to try
   */
  private getNextStrategy(current: SaveStrategy): SaveStrategy {
    const strategies: SaveStrategy[] = ['direct', 'queue', 'batch', 'fallback'];
    const currentIndex = strategies.indexOf(current);
    const nextIndex = (currentIndex + 1) % strategies.length;
    return strategies[nextIndex];
  }

  /**
   * Queue save for batch processing
   */
  private queueSave(attempt: SaveAttempt): void {
    if (this.saveQueue.length >= this.config.queueSize) {
      console.warn('[Lovable Failsafe] Queue full, removing oldest save');
      this.saveQueue.shift();
    }

    this.saveQueue.push(attempt);
    this.pendingSaves.set(attempt.id, attempt);
    
    // Persist queue to localStorage
    this.persistQueue();

    console.log(`[Lovable Failsafe] Queued save ${attempt.id} (${this.saveQueue.length} in queue)`);
  }

  /**
   * Process queued saves in batch
   */
  private async processBatch(): Promise<void> {
    if (this.saveQueue.length === 0) {
      return;
    }

    if (!this.isHealthy) {
      console.warn('[Lovable Failsafe] System unhealthy, skipping batch processing');
      return;
    }

    const batch = [...this.saveQueue];
    this.saveQueue = [];

    console.log(`[Lovable Failsafe] Processing batch of ${batch.length} saves`);

    for (const attempt of batch) {
      try {
        const success = await this.attemptDirectSave(attempt);
        if (!success && attempt.retries < this.config.maxRetries) {
          // Re-queue for retry
          this.queueSave(attempt);
        }
      } catch (error) {
        console.error('[Lovable Failsafe] Batch save failed:', error);
        if (attempt.retries < this.config.maxRetries) {
          this.queueSave(attempt);
        }
      }
    }

    // Persist updated queue
    this.persistQueue();
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const wasHealthy = this.isHealthy;
      
      // Check network connectivity
      const isOnline = navigator.onLine;
      
      // Check Lovable availability
      const isLovableAvailable = this.checkLovableAvailability();
      
      // Check if we've had too many consecutive failures
      const tooManyFailures = this.consecutiveFailures > 10;
      
      // Check if last success was too long ago
      const timeSinceLastSuccess = Date.now() - this.lastSuccessTime;
      const staleSuccess = timeSinceLastSuccess > 300000; // 5 minutes

      this.isHealthy = isOnline && isLovableAvailable && !tooManyFailures && !staleSuccess;

      if (wasHealthy !== this.isHealthy) {
        console.log(`[Lovable Failsafe] Health status changed: ${wasHealthy ? 'healthy' : 'unhealthy'} → ${this.isHealthy ? 'healthy' : 'unhealthy'}`);
        
        if (this.isHealthy) {
          // System recovered, try processing queue
          this.processBatch();
        }
      }

      // Log health status
      if (!this.isHealthy) {
        console.warn('[Lovable Failsafe] System unhealthy:', {
          isOnline,
          isLovableAvailable,
          consecutiveFailures: this.consecutiveFailures,
          timeSinceLastSuccess,
        });
      }
    } catch (error) {
      console.error('[Lovable Failsafe] Health check failed:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Check if Lovable is available
   */
  private checkLovableAvailability(): boolean {
    try {
      // Check if we're in Lovable environment
      const isLovableEnv = this.isLovableEnvironment();
      if (!isLovableEnv) {
        return false;
      }

      // Check if Lovable API is accessible
      const lovable = (window as any).lovable;
      if (!lovable) {
        return false;
      }

      // Check if save function exists
      const hasSaveFunction = typeof lovable.save === 'function';
      
      return hasSaveFunction;
    } catch (error) {
      console.error('[Lovable Failsafe] Lovable availability check failed:', error);
      return false;
    }
  }

  /**
   * Check if we're in Lovable environment
   */
  private isLovableEnvironment(): boolean {
    try {
      // Check hostname
      const hostname = window.location.hostname;
      const isLovableHost = hostname.includes('lovable') || hostname.includes('lovable.dev');
      
      // Check for Lovable global
      const hasLovableGlobal = typeof (window as any).lovable !== 'undefined';
      
      // Check for Lovable user agent
      const userAgent = navigator.userAgent;
      const hasLovableUA = userAgent.includes('Lovable');
      
      return isLovableHost || hasLovableGlobal || hasLovableUA;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.batchInterval = window.setInterval(() => {
      if (this.isHealthy && this.saveQueue.length > 0) {
        this.processBatch();
      }
    }, this.config.batchIntervalMs);
  }

  /**
   * Setup network listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('[Lovable Failsafe] Network online, processing queue');
      this.isHealthy = true;
      this.processBatch();
    });

    window.addEventListener('offline', () => {
      console.warn('[Lovable Failsafe] Network offline');
      this.isHealthy = false;
    });
  }

  /**
   * Setup visibility listeners
   */
  private setupVisibilityListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isHealthy && this.saveQueue.length > 0) {
        console.log('[Lovable Failsafe] Tab visible, processing queue');
        this.processBatch();
      }
    });
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    try {
      const queueData = this.saveQueue.map(attempt => ({
        id: attempt.id,
        timestamp: attempt.timestamp,
        data: attempt.data,
        retries: attempt.retries,
        strategy: attempt.strategy,
      }));
      
      localStorage.setItem('lovable-save-queue', JSON.stringify(queueData));
    } catch (error) {
      console.error('[Lovable Failsafe] Failed to persist queue:', error);
    }
  }

  /**
   * Restore queue from localStorage
   */
  private restoreQueue(): void {
    try {
      const queueData = localStorage.getItem('lovable-save-queue');
      if (!queueData) {
        return;
      }

      const parsed = JSON.parse(queueData);
      if (Array.isArray(parsed)) {
        this.saveQueue = parsed.map(item => ({
          ...item,
          status: 'pending' as const,
        }));
        
        this.saveQueue.forEach(attempt => {
          this.pendingSaves.set(attempt.id, attempt);
        });

        console.log(`[Lovable Failsafe] Restored ${this.saveQueue.length} queued saves`);
        
        // Clear localStorage after restore
        localStorage.removeItem('lovable-save-queue');
      }
    } catch (error) {
      console.error('[Lovable Failsafe] Failed to restore queue:', error);
      localStorage.removeItem('lovable-save-queue');
    }
  }

  /**
   * Record successful save
   */
  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
    this.isHealthy = true;
  }

  /**
   * Record failed save
   */
  private recordFailure(): void {
    this.consecutiveFailures++;
    
    if (this.consecutiveFailures > 5) {
      this.isHealthy = false;
    }
  }

  /**
   * Generate unique attempt ID
   */
  private generateAttemptId(): string {
    return `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      queueSize: this.saveQueue.length,
      pendingSaves: this.pendingSaves.size,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime,
      timeSinceLastSuccess: Date.now() - this.lastSuccessTime,
    };
  }

  /**
   * Force process queue
   */
  async forceProcessQueue(): Promise<void> {
    console.log('[Lovable Failsafe] Force processing queue');
    await this.processBatch();
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    console.log('[Lovable Failsafe] Clearing queue');
    this.saveQueue = [];
    this.pendingSaves.clear();
    localStorage.removeItem('lovable-save-queue');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.batchInterval !== null) {
      clearInterval(this.batchInterval);
    }
  }
}

// Export singleton instance
let failsafeInstance: LovableSaveFailsafe | null = null;

export function initializeLovableFailsafe(config?: Partial<FailsafeConfig>): LovableSaveFailsafe {
  if (!failsafeInstance) {
    failsafeInstance = new LovableSaveFailsafe(config);
  }
  return failsafeInstance;
}

export function getLovableFailsafe(): LovableSaveFailsafe | null {
  return failsafeInstance;
}

// Auto-initialize in Lovable environment
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isLovableEnv = hostname.includes('lovable') || hostname.includes('lovable.dev');
  
  if (isLovableEnv || import.meta.env.DEV) {
    // Initialize in dev mode or Lovable environment
    initializeLovableFailsafe();
  }
}

