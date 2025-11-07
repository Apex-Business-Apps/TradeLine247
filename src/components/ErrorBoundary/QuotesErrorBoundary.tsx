/**
 * Quotes Page Error Boundary
 *
 * Gracefully handles errors in the quotes page with user-friendly recovery UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { telemetry } from '@/lib/observability/telemetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class QuotesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to telemetry
    telemetry.error('Quotes page error', {
      component: 'Quotes',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleNavigateLeads = () => {
    window.location.href = '/leads';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Quotes Unavailable</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an error while loading the quotes page. This might be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Network connectivity issues</li>
                <li>Database temporarily unavailable</li>
                <li>Invalid quote data</li>
              </ul>

              {this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={this.handleNavigateLeads} variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Leads
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
