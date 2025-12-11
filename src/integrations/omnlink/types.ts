export interface OmniLinkEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
  source?: string;
}

export interface OmniLinkConfig {
  enabled: boolean;
  baseUrl?: string;
  tenantId?: string;
  misconfigured?: boolean;
  reason?: string;
}

export interface OmniLinkHealth {
  status: 'disabled' | 'ok' | 'error';
  message?: string;
}

