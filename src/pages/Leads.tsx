import { memo, useMemo } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Loader2, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLeads } from '@/hooks/useLeads';
import { LeadsErrorBoundary } from '@/components/ErrorBoundary/LeadsErrorBoundary';

const LeadsContent = memo(function LeadsContent() {
  const { data, isLoading } = useLeads();
  const leads = data?.leads || [];

  const getStatusColor = useMemo(() => (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-green-500',
      quoted: 'bg-purple-500',
      sold: 'bg-emerald-500',
      lost: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track your sales leads
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading leads...</span>
                </div>
              </Card>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No leads yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by creating a new lead or wait for website inquiries
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Lead
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const fullName = [lead.first_name, lead.last_name]
                .filter(Boolean)
                .join(' ') || 'Unnamed Lead';

              return (
                <Card key={lead.id} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{fullName}</h3>
                        <Badge variant="outline" className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <Badge variant="secondary">
                          Score: {lead.score}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.phone && <span>{lead.phone}</span>}
                        <span>Source: {lead.source}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button size="sm">Contact</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
});

// Wrap with error boundary for graceful error handling
const Leads = () => (
  <LeadsErrorBoundary>
    <LeadsContent />
  </LeadsErrorBoundary>
);

export default Leads;
