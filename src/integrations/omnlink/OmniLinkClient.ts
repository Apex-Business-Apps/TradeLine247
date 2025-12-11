import { OmniLinkConfig, OmniLinkEvent, OmniLinkHealth } from './types';
import { loadOmniLinkConfig } from './config';

export function isEnabled(config: OmniLinkConfig = loadOmniLinkConfig()): boolean {
  return Boolean(config.enabled && !config.misconfigured);
}

async function postEvent(config: OmniLinkConfig, event: OmniLinkEvent): Promise<void> {
  if (!config.baseUrl || !config.tenantId) return;

  const url = `${config.baseUrl.replace(/\/$/, '')}/tenants/${config.tenantId}/events`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OmniLink-Tenant': config.tenantId,
    },
    body: JSON.stringify({
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    }),
  });
}

export async function sendEvent(
  event: OmniLinkEvent,
  cfg: OmniLinkConfig = loadOmniLinkConfig(),
): Promise<void> {
  if (!cfg.enabled) {
    return;
  }

  if (cfg.misconfigured) {
    console.warn('[OmniLink] Enabled but misconfigured:', cfg.reason);
    return;
  }

  try {
    await postEvent(cfg, event);
  } catch (error) {
    console.warn('[OmniLink] Failed to send event (non-blocking):', error);
  }
}

export async function healthCheck(cfg: OmniLinkConfig = loadOmniLinkConfig()): Promise<OmniLinkHealth> {
  if (!cfg.enabled) {
    return { status: 'disabled', message: 'OmniLink is disabled' };
  }

  if (cfg.misconfigured) {
    return { status: 'error', message: cfg.reason };
  }

  try {
    const healthUrl = `${cfg.baseUrl?.replace(/\/$/, '')}/health`;
    if (healthUrl) {
      const response = await fetch(healthUrl, { method: 'GET' });
      if (!response.ok) {
        return { status: 'error', message: `Health probe failed with status ${response.status}` };
      }
    }
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: `Health probe error: ${(error as Error)?.message ?? 'unknown'}` };
  }
}

