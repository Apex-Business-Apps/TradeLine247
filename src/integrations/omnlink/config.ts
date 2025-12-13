import { env } from '@/utils/env';
import { OmniLinkConfig } from './types';

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function loadOmniLinkConfig(): OmniLinkConfig {
  const enabled = parseBoolean(env('OMNILINK_ENABLED'));
  const baseUrl = env('OMNILINK_BASE_URL');
  const tenantId = env('OMNILINK_TENANT_ID');

  if (!enabled) {
    return { enabled: false };
  }

  const missing: string[] = [];
  if (!baseUrl) missing.push('OMNILINK_BASE_URL');
  if (!tenantId) missing.push('OMNILINK_TENANT_ID');

  if (missing.length > 0) {
    return {
      enabled: true,
      baseUrl,
      tenantId,
      misconfigured: true,
      reason: `Missing required config: ${missing.join(', ')}`,
    };
  }

  return {
    enabled: true,
    baseUrl,
    tenantId,
    misconfigured: false,
  };
}

