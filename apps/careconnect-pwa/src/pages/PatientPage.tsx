import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function PatientPage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getPatientSummary('patient-001')
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!summary) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">My Health Clipboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">Demographics</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="font-medium">
                {summary.demographics.name.given}{' '}
                {summary.demographics.name.family}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Date of Birth</dt>
              <dd className="font-medium">
                {summary.demographics.date_of_birth}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Gender</dt>
              <dd className="font-medium capitalize">
                {summary.demographics.gender}
              </dd>
            </div>
          </dl>
        </div>

        {/* Health Card */}
        {summary.health_card && (
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Health Card</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Number</dt>
                <dd className="font-medium font-mono">
                  {summary.health_card.number}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Province</dt>
                <dd className="font-medium">{summary.health_card.province}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Expiry</dt>
                <dd className="font-medium">
                  {summary.health_card.expiry_date}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Insurance */}
        {summary.insurance && (
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Insurance</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Provider</dt>
                <dd className="font-medium">{summary.insurance.provider}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Policy #</dt>
                <dd className="font-medium font-mono">
                  {summary.insurance.policy_number}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Recent Vitals */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">Recent Vitals</h3>
          <div className="space-y-3">
            {summary.recent_vitals.slice(0, 3).map((vital: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm capitalize">{vital.type}</span>
                <span className="font-medium">
                  {vital.value} {vital.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Medications</h3>
        <div className="space-y-3">
          {summary.medications.map((med: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <div className="font-medium">{med.name}</div>
                <div className="text-sm text-muted-foreground">
                  {med.dosage} {med.frequency && `· ${med.frequency}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
