import { memo, useMemo } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { QuotesErrorBoundary } from '@/components/ErrorBoundary/QuotesErrorBoundary';

const QuotesContent = memo(function QuotesContent() {
  const mockQuotes = [
    {
      id: '1',
      lead_name: 'John Smith',
      vehicle: '2024 Toyota Camry XLE',
      total_price: 34599,
      status: 'sent',
      valid_until: '2025-10-08',
      created_at: '2025-10-01T10:30:00Z',
    },
    {
      id: '2',
      lead_name: 'Sarah Johnson',
      vehicle: '2023 Honda CR-V EX-L',
      total_price: 38299,
      status: 'viewed',
      valid_until: '2025-10-10',
      created_at: '2025-09-30T15:20:00Z',
    },
  ];

  const getStatusColor = useMemo(() => (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      viewed: 'bg-yellow-500',
      accepted: 'bg-green-500',
      expired: 'bg-red-500',
      declined: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground mt-2">
              Manage vehicle quotes and pricing
            </p>
          </div>
          <Button asChild>
            <Link to="/quotes/new">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="space-y-4">
          {mockQuotes.map((quote) => (
            <Card key={quote.id} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{quote.vehicle}</h3>
                    <Badge variant="outline" className={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                    <span>Customer: {quote.lead_name}</span>
                    <span>Valid until: {new Date(quote.valid_until).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">${quote.total_price.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
});

// Wrap with error boundary for graceful error handling
const Quotes = () => (
  <QuotesErrorBoundary>
    <QuotesContent />
  </QuotesErrorBoundary>
);

export default Quotes;
