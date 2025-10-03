import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  title: string;
  description: string;
  fields: {
    name: string;
    label: string;
    placeholder: string;
    type?: string;
  }[];
  instructions?: string;
}

export function IntegrationDialog({
  open,
  onOpenChange,
  provider,
  title,
  description,
  fields,
  instructions,
}: IntegrationDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Input validation schema - prevents injection attacks
  const credentialSchema = z.object({
    value: z.string()
      .trim()
      .min(1, 'Field cannot be empty')
      .max(500, 'Value too long')
      .refine((val) => !/[<>{}]/.test(val), 'Invalid characters detected')
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate all inputs against injection attacks
      for (const [key, value] of Object.entries(formData)) {
        const validation = credentialSchema.safeParse({ value });
        if (!validation.success) {
          throw new Error(`Invalid ${key}: ${validation.error.errors[0].message}`);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // SECURITY: Store credentials securely via Edge Function (not in database config field)
      const { data: secretData, error: secretError } = await supabase.functions.invoke('store-integration-credentials', {
        body: {
          provider,
          organization_id: profile.organization_id,
          credentials: formData,
        },
      });

      if (secretError) throw secretError;

      // Store only non-sensitive metadata in integrations table
      const { error } = await supabase
        .from('integrations')
        .insert({
          organization_id: profile.organization_id,
          provider,
          name: title,
          config: {}, // Non-sensitive config only
          credential_vault_key: secretData.vault_key,
          credential_rotated_at: new Date().toISOString(),
          active: true,
        });

      if (error) throw error;

      toast({
        title: 'Integration saved',
        description: `${title} has been configured securely.`,
      });

      onOpenChange(false);
      setFormData({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title} Integration</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {instructions && (
            <div className="bg-muted p-3 rounded-md text-sm">
              {instructions}
            </div>
          )}

          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [field.name]: e.target.value })
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
