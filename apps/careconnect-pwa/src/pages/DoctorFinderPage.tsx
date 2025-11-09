import { useState } from 'react'
import { api } from '../api/client'

export function DoctorFinderPage() {
  const [subscribed, setSubscribed] = useState(false)
  const [subscriberId, setSubscriberId] = useState<string | null>(null)
  const [matches, setMatches] = useState<any[]>([])

  const handleSubscribe = async () => {
    try {
      const result = await api.subscribeDoctorFinder({
        region: 'AB',
        language: 'en',
        specialty: 'family',
      })
      setSubscriberId(result.subscriber_id)
      setSubscribed(true)

      // Fetch matches
      const matchesData = await api.getDoctorMatches(result.subscriber_id)
      setMatches(matchesData.data || [])
    } catch (error) {
      console.error('Subscription failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Doctor Finder</h2>

      {!subscribed ? (
        <div className="bg-card p-6 rounded-lg border max-w-2xl">
          <h3 className="text-xl font-semibold mb-4">
            Find Accepting Providers
          </h3>
          <p className="text-muted-foreground mb-6">
            Opt-in to receive warm intros for local providers accepting
            patients. We use compliant sources only (public directories,
            official APIs).
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>Alberta (AB)</option>
                <option>British Columbia (BC)</option>
                <option>Ontario (ON)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specialty
              </label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>Family Medicine</option>
                <option>Cardiology</option>
                <option>Pediatrics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Language
              </label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>English</option>
                <option>French</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Subscribe
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 p-4 rounded-md">
            <p className="text-green-800 font-medium">
              ✓ Subscribed successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Subscription ID: {subscriberId}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Matched Providers</h3>
            <div className="space-y-4">
              {matches.length === 0 ? (
                <p className="text-muted-foreground">
                  No matches yet. Check back soon!
                </p>
              ) : (
                matches.map((match) => (
                  <div
                    key={match.provider_id}
                    className="bg-card p-4 rounded-lg border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{match.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {match.specialty}
                        </p>
                        {match.location && (
                          <p className="text-sm mt-1">
                            {match.location.city}, {match.location.province}
                          </p>
                        )}
                        {match.languages && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Languages: {match.languages.join(', ')}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-md ${
                          match.accepting_patients
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {match.accepting_patients
                          ? 'Accepting'
                          : 'Not Accepting'}
                      </span>
                    </div>
                    <a
                      href={match.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      View source
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
