/**
 * Connector Manager with Circuit Breaker and Offline Queue
 * 
 * Provides resilient access to DMS connectors with graceful degradation
 */

import { CircuitBreaker, circuitBreakerRegistry } from '../resilience/circuitBreaker';
import { OfflineQueue, offlineQueue, QueuedOperation } from '../resilience/offlineQueue';
import { createConnector, type DMSConnector, type ConnectorConfig } from './index';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectorStatus {
  provider: string;
  connected: boolean;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastSync?: Date;
  queuedOperations: number;
  error?: string;
}

export class ConnectorManager {
  private connectors = new Map<string, DMSConnector>();
  private configs = new Map<string, ConnectorConfig>();

  /**
   * Initialize connector with circuit breaker
   */
  async initialize(config: ConnectorConfig): Promise<boolean> {
    const breaker = circuitBreakerRegistry.getOrCreate(`connector-${config.provider}`);

    try {
      const result = await breaker.execute(async () => {
        const connector = createConnector(config.provider);
        const connected = await connector.connect(config);
        
        if (!connected) {
          throw new Error(`Failed to connect to ${config.provider}`);
        }

        this.connectors.set(config.provider, connector);
        this.configs.set(config.provider, config);

        return connected;
      });

      console.log(`[ConnectorManager] Initialized ${config.provider}`);
      return result;
    } catch (error) {
      console.error(`[ConnectorManager] Failed to initialize ${config.provider}:`, error);
      return false;
    }
  }

  /**
   * Execute operation with circuit breaker and offline queue fallback
   */
  async execute<T>(
    provider: string,
    operation: string,
    fn: (connector: DMSConnector) => Promise<T>,
    payload?: Record<string, unknown>
  ): Promise<T | null> {
    const breaker = circuitBreakerRegistry.getOrCreate(`connector-${provider}`);
    const connector = this.connectors.get(provider);

    if (!connector) {
      console.error(`[ConnectorManager] Connector ${provider} not initialized`);
      
      // Queue for later
      if (payload) {
        offlineQueue.enqueue(provider, operation, payload);
      }
      
      return null;
    }

    try {
      return await breaker.execute(() => fn(connector));
    } catch (error) {
      console.error(`[ConnectorManager] ${provider}.${operation} failed:`, error);
      
      // Queue for later if circuit is open
      if (breaker.getState() === 'OPEN' && payload) {
        offlineQueue.enqueue(provider, operation, payload);
      }
      
      throw error;
    }
  }

  /**
   * Process offline queue
   */
  async processQueue() {
    await offlineQueue.process(async (op: QueuedOperation) => {
      const connector = this.connectors.get(op.connector);
      
      if (!connector) {
        throw new Error(`Connector ${op.connector} not available`);
      }

      // Execute the queued operation based on type
      switch (op.operation) {
        case 'syncVehicles':
          await connector.syncVehicles();
          break;
        case 'createLead':
          await connector.createLead(op.payload);
          break;
        case 'updateLead':
          await connector.updateLead(op.payload.id, op.payload.data);
          break;
        case 'createQuote':
          await connector.createQuote(op.payload);
          break;
        case 'submitCreditApp':
          await connector.submitCreditApp(op.payload);
          break;
        default:
          throw new Error(`Unknown operation: ${op.operation}`);
      }
    });
  }

  /**
   * Get status of all connectors
   */
  async getStatus(): Promise<ConnectorStatus[]> {
    const statuses: ConnectorStatus[] = [];

    for (const [provider, connector] of this.connectors) {
      const breaker = circuitBreakerRegistry.get(`connector-${provider}`);
      const queuedOps = offlineQueue.getByConnector(provider);

      try {
        const connected = await connector.testConnection();
        
        statuses.push({
          provider,
          connected,
          circuitState: breaker?.getState() || 'CLOSED',
          queuedOperations: queuedOps.filter(op => op.status === 'pending').length,
        });
      } catch (error) {
        statuses.push({
          provider,
          connected: false,
          circuitState: breaker?.getState() || 'OPEN',
          queuedOperations: queuedOps.filter(op => op.status === 'pending').length,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return statuses;
  }

  /**
   * Load integrations from database
   */
  async loadFromDatabase(organizationId: string) {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true);

    if (error) {
      console.error('[ConnectorManager] Failed to load integrations:', error);
      return;
    }

    for (const integration of integrations || []) {
      // Parse config from Json type
      const configData = typeof integration.config === 'string' 
        ? JSON.parse(integration.config) 
        : integration.config;

      const configDataObj = configData as Record<string, unknown>;
      const config: ConnectorConfig = {
        provider: integration.provider as 'autovance' | 'dealertrack' | 'other',
        apiKey: (configDataObj.apiKey as string) || '',
        baseUrl: (configDataObj.baseUrl as string) || '',
        environment: (configDataObj.environment as 'sandbox' | 'production') || 'production',
        enabled: true,
      };

      await this.initialize(config);
    }

    console.log(`[ConnectorManager] Loaded ${integrations?.length || 0} integrations`);
  }

  /**
   * Get connector instance (for direct access)
   */
  getConnector(provider: string): DMSConnector | undefined {
    return this.connectors.get(provider);
  }

  /**
   * Reset circuit breaker for a provider
   */
  resetCircuitBreaker(provider: string) {
    circuitBreakerRegistry.reset(`connector-${provider}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    circuitBreakerRegistry.resetAll();
  }
}

export const connectorManager = new ConnectorManager();
