/**
 * DMS Connector SDK
 * 
 * Factory and utilities for managing DMS integrations
 */

import type { DMSConnector, ConnectorConfig } from './types';
import { AutovanceConnector } from './autovance';
import { DealertrackConnector } from './dealertrack';

export * from './types';
export { AutovanceConnector } from './autovance';
export { DealertrackConnector } from './dealertrack';

/**
 * Create a DMS connector instance based on provider type
 */
export function createConnector(provider: 'autovance' | 'dealertrack' | 'other'): DMSConnector {
  switch (provider) {
    case 'autovance':
      return new AutovanceConnector();
    case 'dealertrack':
      return new DealertrackConnector();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Initialize and connect to a DMS provider
 */
export async function connectToDMS(config: ConnectorConfig): Promise<DMSConnector> {
  const connector = createConnector(config.provider);
  
  const connected = await connector.connect(config);
  if (!connected) {
    throw new Error(`Failed to connect to ${config.provider}`);
  }

  return connector;
}

/**
 * Test connection to all configured DMS providers
 */
export async function testAllConnections(configs: ConnectorConfig[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const config of configs) {
    const connector = createConnector(config.provider);
    try {
      await connector.connect(config);
      results[config.provider] = await connector.testConnection();
      await connector.disconnect();
    } catch (error) {
      console.error(`Error testing ${config.provider}:`, error);
      results[config.provider] = false;
    }
  }

  return results;
}
