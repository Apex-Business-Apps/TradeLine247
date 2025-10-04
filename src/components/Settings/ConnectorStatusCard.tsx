/**
 * Connector Status Dashboard Component
 * 
 * Displays real-time status of DMS connectors with circuit breaker state
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { connectorManager, type ConnectorStatus } from '@/lib/connectors/manager';
import { offlineQueue } from '@/lib/resilience/offlineQueue';

export function ConnectorStatusCard() {
  const [statuses, setStatuses] = useState<ConnectorStatus[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const statusData = await connectorManager.getStatus();
      setStatuses(statusData);
      setQueuedCount(offlineQueue.getPendingCount());
    } catch (error) {
      console.error('Failed to load connector status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      await connectorManager.processQueue();
      await loadStatus();
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetCircuit = (provider: string) => {
    connectorManager.resetCircuitBreaker(provider);
    loadStatus();
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getCircuitBadge = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'HALF_OPEN':
        return <Badge variant="secondary"><Activity className="h-3 w-3 mr-1" />Recovering</Badge>;
      case 'OPEN':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading && statuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connector Status</CardTitle>
          <CardDescription>Loading connector information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connector Status</CardTitle>
            <CardDescription>Real-time DMS integration health</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {statuses.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No connectors configured. Add integrations in the Settings page.
            </AlertDescription>
          </Alert>
        ) : (
          statuses.map(status => (
            <div key={status.provider} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold capitalize">{status.provider}</h3>
                  {getCircuitBadge(status.circuitState)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {status.connected ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" />
                      Disconnected
                    </span>
                  )}
                </div>
                {status.queuedOperations > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {status.queuedOperations} operations queued
                  </div>
                )}
                {status.error && (
                  <div className="text-sm text-destructive">
                    {status.error}
                  </div>
                )}
              </div>
              {status.circuitState === 'OPEN' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResetCircuit(status.provider)}
                >
                  Reset Circuit
                </Button>
              )}
            </div>
          ))
        )}

        {queuedCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{queuedCount} operations pending in offline queue</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleProcessQueue}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Process Queue'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
