import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { error } = await supabase
        .from('integrations')
        .insert({
          organization_id: profile.organization_id,
          provider,
          name: title,
          config: formData,
          active: true,
        });

      if (error) throw error;

      toast({
        title: 'Integration saved',
        description: `${title} has been configured successfully.`,
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
