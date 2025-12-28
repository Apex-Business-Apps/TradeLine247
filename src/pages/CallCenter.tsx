import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, RefreshCw, Download, ExternalLink, PhoneCall } from 'lucide-react';
import { useTwilioCallData } from '@/hooks/useTwilioCallData';
import { TwilioStats } from '@/components/dashboard/TwilioStats';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import backgroundImage from '@/assets/BACKGROUND_IMAGE1.svg';
import { createBrandGradientStyle } from '@/styles/brandGradients';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'ringing':
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'no-answer':
    case 'busy':
    case 'failed':
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function CallCenter() {
  const { calls, loading, error, refresh, formatDuration, formatTimeAgo } = useTwilioCallData();
  const { isAdmin } = useAuth();
  const gradientBackgroundStyle = createBrandGradientStyle(backgroundImage);

  const handleExportCalls = () => {
    if (calls.length === 0) return;
    
    // Create CSV content
    const headers = ['Call ID', 'From', 'To', 'Status', 'Duration', 'Date', 'Direction'];
    const csvContent = [
      headers.join(','),
      ...calls.map(call => [
        call.call_sid,
        call.from_number,
        call.to_number,
        call.call_status,
        formatDuration(call.duration),
        new Date(call.created_at).toLocaleString(),
        call.direction
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twilio-calls-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOHead 
        title="Calls Dashboard - TradeLine 24/7"
        description="Monitor and manage your Twilio voice calls with real-time statistics and call history."
        keywords="call center, Twilio, voice calls, call monitoring, phone system"
      />
      
      <div 
        className="min-h-screen flex flex-col relative"
        style={gradientBackgroundStyle}
      >
        {/* Background image layer - bottom layer, no pointer events */}
        <div
          className="fixed inset-0 -z-[1]"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Calls Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor and manage your Twilio voice calls in real-time
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCalls}
                  disabled={calls.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <TwilioStats />
          </div>

          {/* Call History */}
          <Card 
            className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm"
            style={{ 
              boxShadow: 'var(--premium-shadow-subtle)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
              border: '1px solid hsl(var(--premium-border))'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <PhoneCall className="h-5 w-5 text-primary/70" />
                </div>
                <span>Call History</span>
                <Badge variant="secondary" className="ml-auto">
                  {calls.length} calls
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {error && (
                <div className="text-center py-8 text-destructive">
                  <p>Failed to load call data: {error}</p>
                  <Button variant="outline" onClick={refresh} className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}

              {!error && calls.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No calls yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your AI receptionist will log incoming calls here
                  </p>

                  {/* ADMIN-ONLY TEST PANEL */}
                  {isAdmin && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">🔧 Admin Test Panel</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Your Twilio integration is ready! Test it by calling:
                      </p>
                      <div className="inline-block p-2 bg-primary/10 rounded border border-primary/20">
                        <span className="text-sm font-mono font-semibold" style={{ color: 'hsl(15, 100%, 35%)', textShadow: 'none' }}>+1-587-742-8885</span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p>✓ Voice webhooks configured</p>
                        <p>✓ Call forwarding to +1-431-990-0222</p>
                        <p>✓ Real-time call monitoring active</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {calls.length > 0 && (
                <div className="space-y-3">
                  {calls.map((call) => {
                    const formattedNumber = call.from_number.replace('+1', '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    
                    return (
                      <div 
                        key={call.call_sid}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 border border-transparent hover:border-primary/10 transition-all duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {formattedNumber}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(call.call_status)}`}
                            >
                              {call.call_status}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {call.direction}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{formatTimeAgo(call.created_at)}</span>
                            <span>Duration: {formatDuration(call.duration)}</span>
                            {call.answered_by && (
                              <span>Answered by: {call.answered_by}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {call.recording_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(call.recording_url, '_blank')}
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="text-xs">Recording</span>
                            </Button>
                          )}
                          <div className="text-xs text-muted-foreground font-mono">
                            {call.call_sid.slice(-8)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
