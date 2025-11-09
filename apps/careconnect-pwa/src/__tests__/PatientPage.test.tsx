import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PatientPage } from '../pages/PatientPage'

// Mock API module
vi.mock('../api/client', () => ({
  api: {
    getPatientSummary: vi.fn().mockResolvedValue({
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
      },
      recent_vitals: [
        {
          type: 'blood-pressure',
          value: 120,
          unit: 'mmHg',
          effective_date_time: new Date().toISOString(),
        },
      ],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'once daily',
        },
      ],
    }),
  },
}))

describe('PatientPage', () => {
  it('renders patient summary', async () => {
    render(<PatientPage />)

    await waitFor(() => {
      expect(screen.getByText('My Health Clipboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('1985-03-15')).toBeInTheDocument()
  })

  it('displays health card information', async () => {
    render(<PatientPage />)

    await waitFor(() => {
      expect(screen.getByText('1234-567-890')).toBeInTheDocument()
    })
  })

  it('shows medications list', async () => {
    render(<PatientPage />)

    await waitFor(() => {
      expect(screen.getByText('Lisinopril')).toBeInTheDocument()
    })
  })
})
