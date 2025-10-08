import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Mail, Calendar, UserCircle } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  provider: string;
  icon: any;
  description: string;
  scopes: string[];
  status: 'available' | 'coming_soon';
}

const integrations: Integration[] = [
  {
    id: 'google',
    name: 'Google',
    provider: 'google',
    icon: Mail,
    description: 'Connect Gmail and Google Calendar',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar'],
    status: 'available',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    provider: 'microsoft',
    icon: Calendar,
    description: 'Connect Outlook and Office 365',
    scopes: ['Mail.Read', 'Calendars.ReadWrite'],
    status: 'available',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    provider: 'hubspot',
    icon: UserCircle,
    description: 'Sync contacts and deals',
    scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read'],
    status: 'available',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    provider: 'salesforce',
    icon: UserCircle,
    description: 'Connect Salesforce CRM',
    scopes: [],
    status: 'coming_soon',
  },
];

export default function OAuthIntegrations() {
  const { toast } = useToast();
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnectedIntegrations();
  }, []);

  const loadConnectedIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*');

      if (error) throw error;

      const connected = data?.reduce((acc, token) => {
        acc[token.provider] = token;
        return acc;
      }, {} as Record<string, any>) || {};

      setConnectedIntegrations(connected);
    } catch (error: any) {
      console.error('Error loading integrations:', error);
    }
  };

  const handleConnect = async (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      toast({
        title: "Coming soon",
        description: `${integration.name} integration will be available soon`,
      });
      return;
    }

    setLoading({ ...loading, [integration.provider]: true });

    try {
      const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-callback?provider=${integration.provider}`;
      const state = crypto.randomUUID();

      let authUrl = '';
      if (integration.provider === 'google') {
        const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Configure in Supabase secrets
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(integration.scopes.join(' '))}&` +
          `state=${state}&` +
          `access_type=offline&` +
          `prompt=consent`;
      } else if (integration.provider === 'microsoft') {
        const clientId = 'YOUR_MICROSOFT_CLIENT_ID'; // Configure in Supabase secrets
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(integration.scopes.join(' '))}&` +
          `state=${state}&` +
          `response_mode=query`;
      } else if (integration.provider === 'hubspot') {
        const clientId = 'YOUR_HUBSPOT_CLIENT_ID'; // Configure in Supabase secrets
        authUrl = `https://app.hubspot.com/oauth/authorize?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent(integration.scopes.join(' '))}&` +
          `state=${state}`;
      }

      window.open(authUrl, '_blank', 'width=600,height=700');

      // Poll for connection
      const pollInterval = setInterval(async () => {
        await loadConnectedIntegrations();
        if (connectedIntegrations[integration.provider]) {
          clearInterval(pollInterval);
          toast({
            title: "Connected",
            description: `${integration.name} connected successfully`,
          });
          setLoading({ ...loading, [integration.provider]: false });
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setLoading({ ...loading, [integration.provider]: false });
      }, 60000);
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading({ ...loading, [integration.provider]: false });
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('provider', provider);

      if (error) throw error;

      setConnectedIntegrations((prev) => {
        const updated = { ...prev };
        delete updated[provider];
        return updated;
      });

      toast({
        title: "Disconnected",
        description: "Integration disconnected successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {integrations.map((integration) => {
        const Icon = integration.icon;
        const isConnected = !!connectedIntegrations[integration.provider];
        const isLoading = loading[integration.provider];
        const connectedData = connectedIntegrations[integration.provider];

        return (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {integration.name}
                      {isConnected && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {integration.status === 'coming_soon' && (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isConnected ? (
                    <>
                      {connectedData?.last_sync_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last sync: {new Date(connectedData.last_sync_at).toLocaleDateString()}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.provider)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(integration)}
                      disabled={isLoading || integration.status === 'coming_soon'}
                      size="sm"
                    >
                      {isLoading ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {isConnected && connectedData && (
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Connected as: {connectedData.user_email || 'User'}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}