import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, RefreshCw, Phone, Link2, Search, BarChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkEntitlement } from '@/lib/entitlement';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'not_connected' | 'checking';
  lastChecked?: Date;
  icon: any;
}

export function SystemStatusCard() {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([
    { name: 'Telephony', status: 'checking', icon: Phone },
    { name: 'Integrations', status: 'checking', icon: Link2 },
    { name: 'Vehicle Search', status: 'checking', icon: Search },
    { name: 'Analytics', status: 'checking', icon: BarChart },
  ]);
  const [loading, setLoading] = useState(false);

  const checkSystemStatus = async () => {
    setLoading(true);
    const newStatuses: ServiceStatus[] = [];

    // Check Telephony
    try {
      const { data: phoneNumbers } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('active', true)
        .limit(1);
      
      newStatuses.push({
        name: 'Telephony',
        status: phoneNumbers && phoneNumbers.length > 0 ? 'connected' : 'not_connected',
        lastChecked: new Date(),
        icon: Phone,
      });
    } catch {
      newStatuses.push({ name: 'Telephony', status: 'not_connected', lastChecked: new Date(), icon: Phone });
    }

    // Check OAuth Integrations
    try {
      const { data: oauthTokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .limit(1);
      
      newStatuses.push({
        name: 'Integrations',
        status: oauthTokens && oauthTokens.length > 0 ? 'connected' : 'not_connected',
        lastChecked: new Date(),
        icon: Link2,
      });
    } catch {
      newStatuses.push({ name: 'Integrations', status: 'not_connected', lastChecked: new Date(), icon: Link2 });
    }

    // Check Vehicle Search (vehicles table access)
    try {
      const { error } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);
      
      newStatuses.push({
        name: 'Vehicle Search',
        status: !error ? 'connected' : 'not_connected',
        lastChecked: new Date(),
        icon: Search,
      });
    } catch {
      newStatuses.push({ name: 'Vehicle Search', status: 'not_connected', lastChecked: new Date(), icon: Search });
    }

    // Check Analytics entitlement
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (profile?.organization_id) {
          const hasAnalytics = await checkEntitlement(profile.organization_id, 'analytics');
          newStatuses.push({
            name: 'Analytics',
            status: hasAnalytics ? 'connected' : 'not_connected',
            lastChecked: new Date(),
            icon: BarChart,
          });
        } else {
          newStatuses.push({ name: 'Analytics', status: 'not_connected', lastChecked: new Date(), icon: BarChart });
        }
      } else {
        newStatuses.push({ name: 'Analytics', status: 'not_connected', lastChecked: new Date(), icon: BarChart });
      }
    } catch {
      newStatuses.push({ name: 'Analytics', status: 'not_connected', lastChecked: new Date(), icon: BarChart });
    }

    setStatuses(newStatuses);
    setLoading(false);
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'not_connected':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not Connected</Badge>;
      case 'checking':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1 animate-spin" />Checking...</Badge>;
    }
  };

  const allConnected = statuses.every(s => s.status === 'connected');
  const someConnected = statuses.some(s => s.status === 'connected');

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              System Status
              {allConnected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {allConnected 
                ? 'All systems operational' 
                : someConnected 
                ? 'Some systems connected' 
                : 'No systems connected'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkSystemStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className="flex flex-col items-center justify-center p-4 border rounded-lg space-y-2"
              >
                <Icon className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">{service.name}</div>
                {getStatusBadge(service.status)}
                {service.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    {service.lastChecked.toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
