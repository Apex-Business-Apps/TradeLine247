/**
 * MSW Mock Handlers - Aligned with OpenAPI Contract
 *
 * Mirrors gateway/openapi.yaml responses.
 * Non-PHI synthetic data only.
 */

import { http, HttpResponse } from 'msw'

// Mock data store
const mockData = {
  patient: {
    patient_id: 'patient-001',
    demographics: {
      name: { given: 'Jane', family: 'Doe' },
      date_of_birth: '1985-03-15',
      gender: 'female',
    },
    health_card: {
      number: '1234-567-890',
      province: 'AB',
      expiry_date: '2026-12-31',
    },
    insurance: {
      provider: 'Alberta Blue Cross',
      policy_number: 'ABC123456',
      group_number: 'GRP001',
    },
    recent_vitals: [
      {
        type: 'blood-pressure',
        value: 120,
        unit: 'mmHg',
        effective_date_time: new Date().toISOString(),
      },
      {
        type: 'heart-rate',
        value: 72,
        unit: 'bpm',
        effective_date_time: new Date().toISOString(),
      },
      {
        type: 'temperature',
        value: 36.8,
        unit: '°C',
        effective_date_time: new Date().toISOString(),
      },
    ],
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once daily',
        route: 'oral',
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        route: 'oral',
      },
    ],
  },
  doctorMatches: [
    {
      provider_id: 'dr-001',
      name: 'Dr. Sarah Johnson',
      specialty: 'family',
      location: { city: 'Calgary', province: 'AB' },
      accepting_patients: true,
      languages: ['en'],
      source_url: 'https://search.cpsa.ca/physiciansearch',
    },
    {
      provider_id: 'dr-002',
      name: 'Dr. Pierre Dubois',
      specialty: 'family',
      location: { city: 'Montreal', province: 'QC' },
      accepting_patients: true,
      languages: ['en', 'fr'],
      source_url: 'https://cmq.org/bottin/',
    },
  ],
}

export const handlers = [
  // GET /v1/patients/{patientId}/summary
  http.get('/patients/:patientId/summary', ({ params }) => {
    const { patientId } = params

    if (patientId !== 'patient-001') {
      return HttpResponse.json(
        { error: 'not_found', message: 'Patient not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(mockData.patient)
  }),

  // GET /v1/patients/{patientId}/observations
  http.get('/patients/:patientId/observations', ({ params, request }) => {
    const { patientId } = params
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    if (patientId !== 'patient-001') {
      return HttpResponse.json(
        { error: 'not_found', message: 'Patient not found' },
        { status: 404 }
      )
    }

    const observations = [
      {
        id: 'obs-001',
        type: 'vital-signs',
        value: { systolic: 120, diastolic: 80 },
        effective_date_time: new Date().toISOString(),
      },
      {
        id: 'obs-002',
        type: 'laboratory',
        value: { glucose: 95 },
        effective_date_time: new Date().toISOString(),
      },
    ]

    const filtered = type
      ? observations.filter((o) => o.type === type)
      : observations

    return HttpResponse.json({
      data: filtered,
      meta: { total: filtered.length, offset: 0, limit: 10 },
    })
  }),

  // POST /v1/consents
  http.post('/consents', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json(
      {
        consent_id: crypto.randomUUID(),
        ...(body as any),
        created_at: new Date().toISOString(),
        status: 'active',
      },
      { status: 201 }
    )
  }),

  // POST /v1/qr/links
  http.post('/qr/links', async ({ request }) => {
    const body = await request.json()

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    return HttpResponse.json(
      {
        token: crypto.randomUUID(),
        qr_payload: 'base64-encoded-qr-image',
        expires_at: expiresAt.toISOString(),
      },
      { status: 201 }
    )
  }),

  // POST /v1/qr/links/{token}/consume
  http.post('/qr/links/:token/consume', async ({ params, request }) => {
    const { token } = params
    const body = await request.json()

    return HttpResponse.json({
      session_id: crypto.randomUUID(),
      patient_id: 'patient-001',
      consent_scope: ['vitals', 'medications'],
    })
  }),

  // POST /v1/doctor-finder/subscribe
  http.post('/doctor-finder/subscribe', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json(
      {
        subscriber_id: crypto.randomUUID(),
        ...(body as any),
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // GET /v1/doctor-finder/matches
  http.get('/doctor-finder/matches', ({ request }) => {
    const url = new URL(request.url)
    const subscriberId = url.searchParams.get('subscriberId')

    if (!subscriberId) {
      return HttpResponse.json(
        { error: 'missing_subscriber_id', message: 'subscriberId required' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      data: mockData.doctorMatches,
    })
  }),
]
