import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  Calendar,
  Target,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoiMetrics {
  period_start: string;
  period_end: string;
  hours_saved: number;
  lead_velocity_median_days: number;
  lead_velocity_p90_days: number;
  tasks_completed: number;
  emails_processed: number;
  calls_processed: number;
  bookings_created: number;
  roi_multiplier: number;
}

const ROI_CONSTANTS = {
  HOURS_PER_TASK: 5,  // minutes
  HOURS_PER_EMAIL: 3, // minutes
  HOURS_PER_CALL: 10, // minutes
  HOURLY_RATE: 50,    // dollars per hour saved
};

export default function RoiDashboard() {
  const [metrics, setMetrics] = useState<RoiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data, error } = await supabase.rpc('get_roi_metrics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      if (error) throw error;

      setMetrics(data as RoiMetrics);
    } catch (err) {
      console.error('Failed to load ROI metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      toast({
        title: 'Error',
        description: 'Failed to load ROI dashboard metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Check if ROI dashboard is enabled
  const [featureEnabled, setFeatureEnabled] = useState(false);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const { data: flags } = await supabase
          .from('feature_flags')
          .select('enabled')
          .eq('feature_name', 'ROI_DASHBOARD_ENABLED')
          .single();

        setFeatureEnabled(flags?.enabled || false);
      } catch (err) {
        console.error('Failed to check feature flag:', err);
      }
    };

    checkFeature();
  }, []);

  if (!featureEnabled) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ROI Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ROI Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load ROI metrics</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMetrics}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          ROI Dashboard
          <Badge variant="secondary" className="text-xs">
            Last 30 Days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hours Saved - Main KPI */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {metrics.hours_saved.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            Hours Saved This Month
          </div>
          <div className="text-xs text-muted-foreground">
            ${metrics.roi_multiplier.toLocaleString()} estimated value saved
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-semibold">{metrics.tasks_completed}</div>
            <div className="text-xs text-muted-foreground">Tasks Completed</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-lg font-semibold">{metrics.emails_processed}</div>
            <div className="text-xs text-muted-foreground">Emails Processed</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-lg font-semibold">{metrics.calls_processed}</div>
            <div className="text-xs text-muted-foreground">Calls Processed</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-lg font-semibold">{metrics.bookings_created}</div>
            <div className="text-xs text-muted-foreground">Bookings Created</div>
          </div>
        </div>

        {/* Lead Velocity */}
        {(metrics.lead_velocity_median_days > 0 || metrics.lead_velocity_p90_days > 0) && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Lead Velocity</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {metrics.lead_velocity_median_days.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Median Days</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Call → Booking
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {metrics.lead_velocity_p90_days.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">90th Percentile</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Constants Info */}
        <div className="border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Calculation Method:</strong></div>
            <div>• Task: {ROI_CONSTANTS.HOURS_PER_TASK}min saved per automated task</div>
            <div>• Email: {ROI_CONSTANTS.HOURS_PER_EMAIL}min saved per processed email</div>
            <div>• Call: {ROI_CONSTANTS.HOURS_PER_CALL}min saved per processed call</div>
            <div>• Value: ${ROI_CONSTANTS.HOURLY_RATE}/hour saved (configurable)</div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}