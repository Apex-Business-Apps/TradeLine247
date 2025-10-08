import { useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { IntegrationCard } from '@/components/Settings/IntegrationCard';
import { IntegrationDialog } from '@/components/Settings/IntegrationDialog';
import { ConnectorStatusCard } from '@/components/Settings/ConnectorStatusCard';
import PhoneSMSSettings from '@/components/Settings/PhoneSMSSettings';
import OAuthIntegrations from '@/components/Settings/OAuthIntegrations';

type IntegrationType = 'facebook' | 'instagram' | 'x' | 'tiktok' | 'whatsapp' | 'youtube' | null;

export default function Settings() {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType>(null);
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your dealership settings and preferences
          </p>
        </div>

        <ConnectorStatusCard />

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="oauth">OAuth Apps</TabsTrigger>
            <TabsTrigger value="telephony">Phone & SMS</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dealership Information</CardTitle>
                <CardDescription>
                  Update your dealership details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dealership-name">Dealership Name</Label>
                  <Input id="dealership-name" placeholder="Enter dealership name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealer-license">Dealer License</Label>
                  <Input id="dealer-license" placeholder="License number" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="contact@dealer.com" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Jurisdiction Settings</CardTitle>
                <CardDescription>
                  Configure compliance settings for your jurisdiction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>CASL Compliance (Canada)</Label>
                      <p className="text-sm text-muted-foreground">
                        Canadian Anti-Spam Legislation consent tracking
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>TCPA Compliance (US)</Label>
                      <p className="text-sm text-muted-foreground">
                        Telephone Consumer Protection Act consent logging
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>GDPR Mode (EU)</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhanced privacy controls for EU customers
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>DMS Integrations</CardTitle>
                <CardDescription>
                  Connect with dealer management systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Dealertrack</h4>
                      <p className="text-sm text-muted-foreground">
                        Credit and desking integration
                      </p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Autovance</h4>
                      <p className="text-sm text-muted-foreground">
                        Desking and inventory sync
                      </p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media & Communication</CardTitle>
                <CardDescription>
                  Connect your social media and messaging platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <IntegrationCard
                  title="Facebook"
                  description="Manage Facebook page and lead ads"
                  onConfigure={() => setSelectedIntegration('facebook')}
                />
                <IntegrationCard
                  title="Instagram"
                  description="Connect Instagram business account"
                  onConfigure={() => setSelectedIntegration('instagram')}
                />
                <IntegrationCard
                  title="X (Twitter)"
                  description="Post updates and engage with customers"
                  onConfigure={() => setSelectedIntegration('x')}
                />
                <IntegrationCard
                  title="TikTok"
                  description="Connect TikTok business account"
                  onConfigure={() => setSelectedIntegration('tiktok')}
                />
                <IntegrationCard
                  title="WhatsApp"
                  description="Business messaging and customer support"
                  onConfigure={() => setSelectedIntegration('whatsapp')}
                />
                <IntegrationCard
                  title="YouTube"
                  description="Manage video content and channel"
                  onConfigure={() => setSelectedIntegration('youtube')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>OAuth Integrations</CardTitle>
                <CardDescription>
                  One-click connections to third-party services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OAuthIntegrations />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telephony" className="space-y-6 mt-6">
            <PhoneSMSSettings />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
...
          </TabsContent>
        </Tabs>

        {/* Integration Dialogs */}
        <IntegrationDialog
          open={selectedIntegration === 'facebook'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="facebook"
          title="Facebook"
          description="Connect your Facebook Business page to manage posts and leads"
          fields={[
            { name: 'app_id', label: 'App ID', placeholder: 'Your Facebook App ID' },
            { name: 'app_secret', label: 'App Secret', placeholder: 'Your Facebook App Secret', type: 'password' },
            { name: 'page_id', label: 'Page ID', placeholder: 'Your Facebook Page ID' },
          ]}
          instructions="Get your credentials from Facebook Developer Console at https://developers.facebook.com/"
        />

        <IntegrationDialog
          open={selectedIntegration === 'instagram'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="instagram"
          title="Instagram"
          description="Connect your Instagram Business account"
          fields={[
            { name: 'access_token', label: 'Access Token', placeholder: 'Instagram Access Token', type: 'password' },
            { name: 'business_account_id', label: 'Business Account ID', placeholder: 'Your Instagram Business Account ID' },
          ]}
          instructions="Get your access token from Facebook Developer Console. Instagram integrations use Facebook's Graph API."
        />

        <IntegrationDialog
          open={selectedIntegration === 'x'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="x"
          title="X (Twitter)"
          description="Connect your X account to post updates and engage"
          fields={[
            { name: 'consumer_key', label: 'API Key (Consumer Key)', placeholder: 'Your X API Key' },
            { name: 'consumer_secret', label: 'API Secret (Consumer Secret)', placeholder: 'Your X API Secret', type: 'password' },
            { name: 'access_token', label: 'Access Token', placeholder: 'Your X Access Token' },
            { name: 'access_token_secret', label: 'Access Token Secret', placeholder: 'Your X Access Token Secret', type: 'password' },
          ]}
          instructions="Get your credentials from X Developer Portal at https://developer.x.com/. Make sure your app has Read and Write permissions."
        />

        <IntegrationDialog
          open={selectedIntegration === 'tiktok'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="tiktok"
          title="TikTok"
          description="Connect your TikTok Business account"
          fields={[
            { name: 'client_key', label: 'Client Key', placeholder: 'Your TikTok Client Key' },
            { name: 'client_secret', label: 'Client Secret', placeholder: 'Your TikTok Client Secret', type: 'password' },
          ]}
          instructions="Get your credentials from TikTok for Business at https://business-api.tiktok.com/"
        />

        <IntegrationDialog
          open={selectedIntegration === 'whatsapp'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="whatsapp"
          title="WhatsApp"
          description="Connect WhatsApp Business API for customer messaging"
          fields={[
            { name: 'phone_number_id', label: 'Phone Number ID', placeholder: 'Your WhatsApp Phone Number ID' },
            { name: 'access_token', label: 'Access Token', placeholder: 'Your WhatsApp Access Token', type: 'password' },
            { name: 'business_account_id', label: 'Business Account ID', placeholder: 'Your WhatsApp Business Account ID' },
          ]}
          instructions="Get your credentials from Meta Business Suite. You need a WhatsApp Business Account."
        />

        <IntegrationDialog
          open={selectedIntegration === 'youtube'}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          provider="youtube"
          title="YouTube"
          description="Connect your YouTube channel to manage videos"
          fields={[
            { name: 'client_id', label: 'Client ID', placeholder: 'Your Google Client ID' },
            { name: 'client_secret', label: 'Client Secret', placeholder: 'Your Google Client Secret', type: 'password' },
            { name: 'channel_id', label: 'Channel ID', placeholder: 'Your YouTube Channel ID' },
          ]}
          instructions="Get your credentials from Google Cloud Console at https://console.cloud.google.com/"
        />
      </div>
    </AppLayout>
  );
}
