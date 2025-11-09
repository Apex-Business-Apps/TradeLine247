/**
 * CareConnect API Client
 *
 * MODE switch: 'mock' | 'live'
 * - mock: Uses MSW handlers (default for demo)
 * - live: Calls actual API base URL
 */

import { v4 as uuidv4 } from 'uuid'

export type ApiMode = 'mock' | 'live'

export interface ApiConfig {
  mode: ApiMode
  baseUrl: string
  demoUser?: string
  tenant?: string
}

// Default config (mock mode for PWA demo)
const defaultConfig: ApiConfig = {
  mode: (import.meta.env.VITE_API_MODE as ApiMode) || 'mock',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1',
  demoUser: 'patient-001',
  tenant: 'demo',
}

let currentConfig = { ...defaultConfig }

export function setApiMode(mode: ApiMode) {
  currentConfig.mode = mode
  console.log(`[CareConnect] API mode: ${mode}`)
}

export function getApiMode(): ApiMode {
  return currentConfig.mode
}

export function setDemoUser(userId: string) {
  currentConfig.demoUser = userId
}

export interface FetchOptions extends RequestInit {
  idempotencyKey?: string
}

/**
 * Base fetch wrapper with auth headers
 */
async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { idempotencyKey, headers = {}, ...fetchOptions } = options

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Correlation-Id': uuidv4(),
    'X-Demo-User': currentConfig.demoUser || 'patient-001',
    'X-Tenant': currentConfig.tenant || 'demo',
    ...headers,
  }

  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey
  }

  const url =
    currentConfig.mode === 'mock'
      ? endpoint
      : `${currentConfig.baseUrl}${endpoint}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers: requestHeaders,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'unknown_error',
      message: 'Request failed',
    }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// API methods
export const api = {
  // Patient summary
  getPatientSummary: (patientId: string) =>
    apiFetch(`/patients/${patientId}/summary`),

  // Observations
  listObservations: (
    patientId: string,
    params?: { type?: string; since?: string; until?: string }
  ) => {
    const query = new URLSearchParams(params as Record<string, string>)
    return apiFetch(`/patients/${patientId}/observations?${query}`)
  },

  // Consents
  createConsent: (payload: any) =>
    apiFetch('/consents', {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: uuidv4(),
    }),

  // QR links
  createQrLink: (payload: any) =>
    apiFetch('/qr/links', {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: uuidv4(),
    }),

  consumeQrLink: (token: string, clinicianId: string) =>
    apiFetch(`/qr/links/${token}/consume`, {
      method: 'POST',
      body: JSON.stringify({ clinicianId }),
      idempotencyKey: uuidv4(),
    }),

  // Doctor Finder
  subscribeDoctorFinder: (payload: any) =>
    apiFetch('/doctor-finder/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: uuidv4(),
    }),

  getDoctorMatches: (subscriberId: string) =>
    apiFetch(`/doctor-finder/matches?subscriberId=${subscriberId}`),
}
