import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Server,
  Database,
  Zap,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subHours } from 'date-fns';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    cache: ServiceStatus;
    external_apis: ServiceStatus;
    storage: ServiceStatus;
    functions: ServiceStatus;
  };
  metrics: {
    active_connections: number;
    total_requests_today: number;
    error_rate_24h: number;
    avg_response_time: number;
  };
  alerts: AlertData[];
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  last_check: string;
  message?: string;
}

interface AlertData {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component: string;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id?: string;
  ip_address: string;
  message: string;
  created_at: string;
}

interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  collected_at: string;
}

const STATUS_CONFIG = {
  healthy: { color: 'default', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700' },
  degraded: { color: 'secondary', icon: AlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-700' },
  unhealthy: { color: 'destructive', icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-700' }
};

const SEVERITY_CONFIG = {
  low: { color: 'secondary', bg: 'bg-blue-50', text: 'text-blue-700' },
  medium: { color: 'default', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  high: { color: 'destructive', bg: 'bg-orange-50', text: 'text-orange-700' },
  critical: { color: 'destructive', bg: 'bg-red-50', text: 'text-red-700' }
};

export function EnterpriseDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // System health check
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Security events
  const { data: securityEvents, isLoading: securityLoading } = useQuery({
    queryKey: ['security-events', selectedTimeframe],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const timeFilter = {
        '1h': subHours(new Date(), 1),
        '24h': subHours(new Date(), 24),
        '7d': subDays(new Date(), 7),
        '30d': subDays(new Date(), 30)
      }[selectedTimeframe];

      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .gte('created_at', timeFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Performance metrics
  const { data: performanceMetrics, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-metrics', selectedTimeframe],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      const timeFilter = {
        '1h': subHours(new Date(), 1),
        '24h': subHours(new Date(), 24),
        '7d': subDays(new Date(), 7),
        '30d': subDays(new Date(), 30)
      }[selectedTimeframe];

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('collected_at', timeFilter.toISOString())
        .order('collected_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    },
  });

  // Manual refresh
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
    queryClient.invalidateQueries({ queryKey: ['security-events'] });
    queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!performanceMetrics) return null;

    const totalRequests = performanceMetrics.length;
    const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / totalRequests;
    const p95ResponseTime = [...performanceMetrics]
      .sort((a, b) => b.duration_ms - a.duration_ms)[Math.floor(totalRequests * 0.05)]?.duration_ms || 0;

    const operationBreakdown = performanceMetrics.reduce((acc, metric) => {
      acc[metric.operation] = (acc[metric.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime,
      operationBreakdown
    };
  };

  const metrics = calculateMetrics();

  const getServiceIcon = (serviceName: string) => {
    const icons = {
      database: Database,
      cache: MemoryStick,
      external_apis: Globe,
      storage: HardDrive,
      functions: Zap
    };
    return icons[serviceName as keyof typeof icons] || Server;
  };

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading system health...
      </div>
    );
  }

  if (healthError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load system health data. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and security oversight
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            {autoRefresh ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button onClick={refreshData} disabled={!autoRefresh}>
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Status
              </CardTitle>
              <Badge variant={STATUS_CONFIG[healthData.status].color}>
                {healthData.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(healthData.uptime / (1000 * 60 * 60))}h
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {healthData.metrics.total_requests_today}
                </div>
                <div className="text-sm text-muted-foreground">Requests Today</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {healthData.metrics.error_rate_24h}%
                </div>
                <div className="text-sm text-muted-foreground">Error Rate (24h)</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {healthData.metrics.avg_response_time}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Health Grid */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(healthData.services).map(([serviceName, service]) => {
            const Icon = getServiceIcon(serviceName);
            const statusConfig = STATUS_CONFIG[service.status];

            return (
              <Card key={serviceName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium capitalize">{serviceName.replace('_', ' ')}</span>
                    </div>
                    <Badge variant={statusConfig.color}>
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span className="font-medium">{service.response_time_ms}ms</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Last Check</span>
                      <span className="text-muted-foreground">
                        {format(new Date(service.last_check), 'HH:mm:ss')}
                      </span>
                    </div>

                    {service.message && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {service.message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">
            Security
            {healthData?.alerts && healthData.alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {healthData.alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>

          {/* Performance Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {metrics.totalRequests.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total requests in selected period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {metrics.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mean response time
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">P95 Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {metrics.p95ResponseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    95th percentile response time
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Operation Breakdown */}
          {metrics?.operationBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Operation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.operationBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([operation, count]) => (
                      <div key={operation} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{operation}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(count / metrics.totalRequests) * 100}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {securityLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Loading security events...
                </div>
              ) : securityEvents && securityEvents.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge
                        variant={SEVERITY_CONFIG[event.severity as keyof typeof SEVERITY_CONFIG]?.color || 'secondary'}
                        className="mt-1"
                      >
                        {event.severity}
                      </Badge>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{event.event_type.replace('_', ' ')}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'MMM dd, HH:mm:ss')}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{event.message}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>IP: {event.ip_address}</span>
                          {event.user_id && <span>User: {event.user_id.slice(0, 8)}...</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Security Events</h3>
                  <p className="text-muted-foreground">
                    No security events detected in the selected timeframe.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.alerts && healthData.alerts.length > 0 ? (
                <div className="space-y-3">
                  {healthData.alerts.map((alert) => (
                    <Alert key={alert.id} className={`${SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG]?.bg} border-l-4 ${
                      alert.severity === 'critical' ? 'border-l-red-500' :
                      alert.severity === 'high' ? 'border-l-orange-500' :
                      alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{alert.message}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Component: {alert.component} • {format(new Date(alert.created_at), 'MMM dd, HH:mm:ss')}
                            </div>
                          </div>
                          <Badge variant={SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG].color}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">All Systems Normal</h3>
                  <p className="text-muted-foreground">
                    No active alerts. System is operating normally.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}