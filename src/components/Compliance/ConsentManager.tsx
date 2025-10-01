import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

interface ConsentOption {
  id: string;
  type: 'marketing' | 'sms' | 'phone' | 'email' | 'data_processing' | 'third_party';
  labelKey: string;
  descriptionKey?: string;
  required: boolean;
  jurisdiction: string[];
}

interface ConsentManagerProps {
  leadId?: string;
  profileId?: string;
  jurisdiction?: 'ca_on' | 'ca_qc' | 'ca_bc' | 'ca_ab' | 'ca_mb' | 'ca_sk' | 'us' | 'eu';
  onConsentsUpdated?: (consents: Record<string, boolean>) => void;
}

export function ConsentManager({ 
  leadId, 
  profileId, 
  jurisdiction = 'ca_on',
  onConsentsUpdated 
}: ConsentManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const consentOptions: ConsentOption[] = [
    {
      id: 'marketing',
      type: 'marketing',
      labelKey: 'consent.marketing',
      descriptionKey: 'consent.marketing.description',
      required: false,
      jurisdiction: ['ca_on', 'ca_qc', 'ca_bc', 'ca_ab', 'ca_mb', 'ca_sk', 'us', 'eu']
    },
    {
      id: 'sms',
      type: 'sms',
      labelKey: 'consent.sms',
      descriptionKey: 'consent.sms.description',
      required: false,
      jurisdiction: ['ca_on', 'ca_qc', 'ca_bc', 'ca_ab', 'ca_mb', 'ca_sk', 'us']
    },
    {
      id: 'phone',
      type: 'phone',
      labelKey: 'consent.calls',
      descriptionKey: 'consent.calls.description',
      required: false,
      jurisdiction: ['ca_on', 'ca_qc', 'ca_bc', 'ca_ab', 'ca_mb', 'ca_sk', 'us']
    },
    {
      id: 'data_processing',
      type: 'data_processing',
      labelKey: 'consent.privacy',
      descriptionKey: 'consent.privacy.description',
      required: true,
      jurisdiction: ['ca_on', 'ca_qc', 'ca_bc', 'ca_ab', 'ca_mb', 'ca_sk', 'us', 'eu']
    }
  ];

  const relevantConsents = consentOptions.filter(option => 
    option.jurisdiction.includes(jurisdiction)
  );

  const handleConsentChange = (consentId: string, checked: boolean) => {
    const newConsents = { ...consents, [consentId]: checked };
    setConsents(newConsents);
    onConsentsUpdated?.(newConsents);
  };

  const saveConsents = async () => {
    setIsLoading(true);
    try {
      const consentRecords = Object.entries(consents).map(([type, granted]) => ({
        lead_id: leadId,
        profile_id: profileId,
        type: type as any,
        status: (granted ? 'granted' : 'withdrawn') as 'granted' | 'withdrawn' | 'denied' | 'expired',
        jurisdiction,
        purpose: `User consent for ${type}`,
        granted_at: granted ? new Date().toISOString() : null,
        withdrawn_at: !granted ? new Date().toISOString() : null,
        channel: 'web',
        ip_address: 'client-ip', // TODO: Get real IP from edge function
        user_agent: navigator.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          jurisdiction,
          version: '1.0'
        }
      }));

      const { error } = await supabase
        .from('consents')
        .insert(consentRecords);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Consent preferences saved successfully',
      });
    } catch (error) {
      console.error('Error saving consents:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save consent preferences',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allRequiredConsentsGranted = relevantConsents
    .filter(opt => opt.required)
    .every(opt => consents[opt.id]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Consent Manager</CardTitle>
        </div>
        <CardDescription>
          Manage your privacy and communication preferences
          <Badge variant="outline" className="ml-2">
            {jurisdiction.toUpperCase()}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {relevantConsents.map((option) => (
          <div key={option.id} className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id={option.id}
              checked={consents[option.id] || false}
              onCheckedChange={(checked) => handleConsentChange(option.id, checked as boolean)}
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={option.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                {t(option.labelKey)}
                {option.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
                {consents[option.id] && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {consents[option.id] === false && (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </Label>
              {option.descriptionKey && (
                <p className="text-sm text-muted-foreground">
                  {t(option.descriptionKey)}
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {allRequiredConsentsGranted ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All required consents granted
              </span>
            ) : (
              <span className="text-amber-600">
                Please grant all required consents
              </span>
            )}
          </p>
          <Button 
            onClick={saveConsents} 
            disabled={isLoading || !allRequiredConsentsGranted}
          >
            {isLoading ? 'Saving...' : t('common.save')}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>PIPEDA Compliance:</strong> We collect meaningful consent before processing your personal information.</p>
          <p><strong>CASL Compliance:</strong> Express consent is required for commercial electronic messages.</p>
          <p><strong>TCPA Compliance:</strong> Prior express written consent for marketing calls/texts (US).</p>
          <p>You can withdraw consent at any time by updating your preferences.</p>
        </div>
      </CardContent>
    </Card>
  );
}
