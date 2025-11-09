export function ClinicianPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Clinician Portal</h2>

      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">QR Scanner</h3>
        <p className="text-muted-foreground mb-4">
          Scan patient QR code for one-time consent-based access.
        </p>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90">
          Activate Camera
        </button>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Recent Sessions</h3>
        <p className="text-sm text-muted-foreground">
          No active sessions. Scan QR code to begin.
        </p>
      </div>
    </div>
  )
}
