export function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Portal</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Tenants</h3>
          <p className="text-3xl font-bold">1</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-3xl font-bold">3</p>
          <p className="text-sm text-muted-foreground">Registered</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Consents</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">System Health</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>FHIR Adapter</span>
            <span className="text-green-600 font-medium">✓ Healthy</span>
          </div>
          <div className="flex justify-between items-center">
            <span>QR Session Service</span>
            <span className="text-green-600 font-medium">✓ Healthy</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Doctor Finder</span>
            <span className="text-green-600 font-medium">✓ Healthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
