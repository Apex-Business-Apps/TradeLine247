/**
 * Enterprise Dashboard Component
 *
 * Comprehensive admin dashboard with real-time metrics,
 * service health monitoring, and KPI tracking.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Activity,
  Phone,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  uptime: number;
}

interface RecentActivity {
  id: string;
  type: 'call' | 'booking' | 'escalation' | 'alert';
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

interface EnterpriseDashboardProps {
  organizationId: string;
}

export function EnterpriseDashboard({ organizationId }: EnterpriseDashboardProps) {
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [organizationId]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, healthRes, activityRes] = await Promise.all([
        fetch(`/api/admin/metrics?organizationId=${organizationId}`),
        fetch(`/api/admin/health?organizationId=${organizationId}`),
        fetch(`/api/admin/activity?organizationId=${organizationId}`),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setKpis([
          {
            label: 'Total Calls Today',
            value: data.callsToday || 0,
            change: data.callsChange || 0,
            trend: data.callsChange >= 0 ? 'up' : 'down',
            icon: <Phone className="h-4 w-4" />,
          },
          {
            label: 'Bookings',
            value: data.bookingsToday || 0,
            change: data.bookingsChange || 0,
            trend: data.bookingsChange >= 0 ? 'up' : 'down',
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Conversion Rate',
            value: `${data.conversionRate || 0}%`,
            change: data.conversionChange || 0,
            trend: data.conversionChange >= 0 ? 'up' : 'down',
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: 'Revenue',
            value: `$${(data.revenue || 0).toLocaleString()}`,
            change: data.revenueChange || 0,
            trend: data.revenueChange >= 0 ? 'up' : 'down',
            icon: <DollarSign className="h-4 w-4" />,
          },
        ]);
      }

      if (healthRes.ok) {
        const { services } = await healthRes.json();
        setServiceHealth(services || []);
      }

      if (activityRes.ok) {
        const { activities } = await activityRes.json();
        setRecentActivity(activities || []);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4" />;
      case 'alert': return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enterprise Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className={cn(
                "flex items-center text-xs",
                kpi.trend === 'up' ? "text-green-500" : kpi.trend === 'down' ? "text-red-500" : "text-muted-foreground"
              )}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {kpi.change > 0 ? '+' : ''}{kpi.change}% from yesterday
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Service Health</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Real-time health monitoring of all integrated services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-2 w-2 rounded-full", getStatusColor(service.status))} />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {service.responseTime}ms
                      </span>
                      <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                        {service.uptime}% uptime
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest events across your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 rounded-full p-1",
                        activity.severity === 'high' ? "bg-red-100 text-red-500" :
                        activity.severity === 'medium' ? "bg-yellow-100 text-yellow-500" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Key performance indicators over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Call Resolution Rate</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <Progress value={87} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Booking Completion</span>
                    <span className="text-sm text-muted-foreground">72%</span>
                  </div>
                  <Progress value={72} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-muted-foreground">94%</span>
                  </div>
                  <Progress value={94} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI Response Accuracy</span>
                    <span className="text-sm text-muted-foreground">91%</span>
                  </div>
                  <Progress value={91} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnterpriseDashboard;
