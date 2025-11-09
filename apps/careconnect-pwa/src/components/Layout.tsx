import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { setApiMode, getApiMode, type ApiMode } from '../api/client'

export function Layout() {
  const location = useLocation()
  const [mode, setMode] = useState<ApiMode>(getApiMode())

  const handleModeToggle = () => {
    const newMode: ApiMode = mode === 'mock' ? 'live' : 'mock'
    setMode(newMode)
    setApiMode(newMode)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">CareConnect</h1>

            <nav className="flex items-center gap-6">
              <Link
                to="/patient"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/patient')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Patient
              </Link>
              <Link
                to="/clinician"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/clinician')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Clinician
              </Link>
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/admin')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Admin
              </Link>
              <Link
                to="/doctor-finder"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/doctor-finder')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Doctor Finder
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Mode:</span>
              <button
                onClick={handleModeToggle}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'mock'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
                aria-label="Toggle API mode"
              >
                {mode.toUpperCase()}
              </button>
              <span className="text-xs text-muted-foreground">
                {mode === 'mock' ? '(Synthetic Data)' : '(Live API)'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">
            CareConnect © 2025 | PWA Demo: Non-PHI Synthetic Data Only | PHI
            confined to FHIR when enabled
          </p>
        </div>
      </footer>
    </div>
  )
}
