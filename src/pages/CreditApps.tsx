import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CreditApps() {
  const mockApps = [
    {
      id: '1',
      applicant_name: 'John Smith',
      vehicle: '2024 Toyota Camry XLE',
      status: 'pending',
      credit_score: 720,
      submitted_at: '2025-10-01T10:30:00Z',
    },
    {
      id: '2',
      applicant_name: 'Sarah Johnson',
      vehicle: '2023 Honda CR-V EX-L',
      status: 'approved',
      credit_score: 785,
      submitted_at: '2025-09-30T15:20:00Z',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      declined: 'bg-red-500',
      more_info_needed: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credit Applications</h1>
            <p className="text-muted-foreground mt-2">
              Review and manage credit applications
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="space-y-4">
          {mockApps.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{app.applicant_name}</h3>
                    <Badge variant="outline" className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                    <span>Vehicle: {app.vehicle}</span>
                    <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {app.credit_score && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Credit Score</p>
                      <p className="text-2xl font-bold">{app.credit_score}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button size="sm">Process</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
