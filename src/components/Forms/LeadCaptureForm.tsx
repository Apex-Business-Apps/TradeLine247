import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone number is required').max(20),
  preferred_contact: z.enum(['email', 'phone', 'sms']),
  notes: z.string().max(1000).optional(),
  consent_marketing: z.boolean(),
  consent_sms: z.boolean(),
  consent_phone: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
  onSuccess?: () => void;
  vehicleId?: string;
  dealershipId?: string;
}

export function LeadCaptureForm({ onSuccess, vehicleId, dealershipId }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      preferred_contact: 'email',
      notes: '',
      consent_marketing: false,
      consent_sms: false,
      consent_phone: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Get client IP for consent logging
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          dealership_id: dealershipId || '00000000-0000-0000-0000-000000000000',
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          preferred_contact: data.preferred_contact,
          notes: data.notes,
          source: 'website',
          status: 'new',
          vehicle_interest: vehicleId,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Log consents
      const consents = [];
      if (data.consent_marketing) {
        consents.push({
          lead_id: lead.id,
          type: 'marketing',
          status: 'granted',
          purpose: 'Marketing communications',
          jurisdiction: 'ca_on',
          granted_at: new Date().toISOString(),
          ip_address: ip,
          user_agent: navigator.userAgent,
          channel: 'website',
        });
      }
      if (data.consent_sms) {
        consents.push({
          lead_id: lead.id,
          type: 'sms',
          status: 'granted',
          purpose: 'SMS communications (CASL compliant)',
          jurisdiction: 'ca_on',
          granted_at: new Date().toISOString(),
          ip_address: ip,
          user_agent: navigator.userAgent,
          channel: 'website',
        });
      }
      if (data.consent_phone) {
        consents.push({
          lead_id: lead.id,
          type: 'phone',
          status: 'granted',
          purpose: 'Phone call communications',
          jurisdiction: 'ca_on',
          granted_at: new Date().toISOString(),
          ip_address: ip,
          user_agent: navigator.userAgent,
          channel: 'website',
        });
      }

      if (consents.length > 0) {
        const { error: consentError } = await supabase
          .from('consents')
          .insert(consents);

        if (consentError) throw consentError;
      }

      // Log audit event
      await supabase.from('audit_events').insert({
        event_type: 'lead_capture',
        resource_type: 'lead',
        resource_id: lead.id,
        action: 'create',
        ip_address: ip,
        user_agent: navigator.userAgent,
        metadata: {
          source: 'website',
          consents_granted: consents.map(c => c.type),
        },
      });

      toast({
        title: 'Success!',
        description: "We've received your inquiry. A team member will contact you soon.",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Smith" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="john@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="(555) 123-4567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferred_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Method *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="sms">Text Message</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us about your needs..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
          <p className="text-sm font-medium">Communication Preferences</p>
          
          <FormField
            control={form.control}
            name="consent_marketing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I consent to receive marketing communications about vehicles and special offers
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent_sms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I consent to receive text messages (CASL compliant, unsubscribe anytime)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent_phone"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I consent to receive phone calls
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            Your privacy is important to us. We follow all applicable privacy laws including PIPEDA and CASL.
            You can withdraw consent at any time by contacting us or clicking unsubscribe.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Inquiry
        </Button>
      </form>
    </Form>
  );
}
