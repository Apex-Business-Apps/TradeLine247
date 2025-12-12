 
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadOmniLinkConfig } from '../config';
import { healthCheck, isEnabled, sendEvent } from '../OmniLinkClient';

const ORIGINAL_ENV = { ...process.env };

describe('OmniLink integration (optional port)', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('is disabled cleanly when OMNILINK_ENABLED is false', async () => {
    process.env.OMNILINK_ENABLED = 'false';
    const cfg = loadOmniLinkConfig();
    expect(isEnabled(cfg)).toBe(false);

    const fetchSpy = vi.spyOn(global, 'fetch' as any);
    await sendEvent({ type: 'test', payload: {} }, cfg);
    expect(fetchSpy).not.toHaveBeenCalled();

    const health = await healthCheck(cfg);
    expect(health.status).toBe('disabled');
  });

  it('reports misconfiguration when enabled but missing fields', async () => {
    process.env.OMNILINK_ENABLED = 'true';
    process.env.OMNILINK_BASE_URL = '';
    process.env.OMNILINK_TENANT_ID = '';

    const cfg = loadOmniLinkConfig();
    expect(cfg.misconfigured).toBe(true);

    const fetchSpy = vi.spyOn(global, 'fetch' as any);
    const health = await healthCheck(cfg);
    expect(health.status).toBe('error');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends events and passes health when enabled with valid config', async () => {
    process.env.OMNILINK_ENABLED = 'true';
    process.env.OMNILINK_BASE_URL = 'https://omnlink.test';
    process.env.OMNILINK_TENANT_ID = 'tenant-123';

    const cfg = loadOmniLinkConfig();

    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const health = await healthCheck(cfg);
    expect(health.status).toBe('ok');

    await sendEvent({ type: 'test', payload: { hello: 'world' } }, cfg);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // health + event
  });
});

