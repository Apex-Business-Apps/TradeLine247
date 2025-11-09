import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDemoUser } from '../api/client'

export function LoginPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('patient-001')

  const handleLogin = () => {
    setDemoUser(userId)
    navigate('/patient')
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-card p-8 rounded-lg shadow-lg border">
        <h2 className="text-2xl font-bold mb-6">Demo Login</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Demo mode: No real authentication. Select a user ID to continue.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium mb-2"
            >
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="patient-001"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
