import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { telemetry } from '@/lib/observability/telemetry';
import { Shield, CheckCircle } from 'lucide-react';

const qualificationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Valid phone number required').max(20),
  preferredContact: z.enum(['email', 'phone', 'sms']),
  vehicleInterest: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.enum(['immediate', '1-3months', '3-6months', '6+months']),
  tradeIn: z.boolean(),
  tradeInDetails: z.string().optional(),
  notes: z.string().max(1000).optional(),
  // Consent fields
  consentMarketing: z.boolean(),
  consentSms: z.boolean(),
  consentPhone: z.boolean(),
  consentDataProcessing: z.boolean().refine((val) => val === true, {
    message: 'You must consent to data processing to continue'
  }),
});

type QualificationFormData = z.infer<typeof qualificationSchema>;

interface LeadQualificationFormProps {
  dealershipId: string;
  onSuccess?: (leadId: string) => void;
  locale?: 'en' | 'fr';
}

export function LeadQualificationForm({ dealershipId, onSuccess, locale = 'en' }: LeadQualificationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QualificationFormData>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      preferredContact: 'email',
      timeline: '1-3months',
      tradeIn: false,
      consentMarketing: false,
      consentSms: false,
      consentPhone: false,
      consentDataProcessing: false,
    },
  });

  const onSubmit = async (data: QualificationFormData) => {
    setIsSubmitting(true);
    const startTime = performance.now();

    try {
      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          dealership_id: dealershipId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          preferred_contact: data.preferredContact,
          source: 'website',
          status: 'new',
          score: 50, // Base score
          metadata: {
            timeline: data.timeline,
            budget: data.budget,
            vehicle_interest: data.vehicleInterest,
          },
          trade_in: data.tradeIn ? {
            details: data.tradeInDetails
          } : null,
          notes: data.notes,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Create consent records
      const consents = [];
      const now = new Date().toISOString();
      const consentMetadata = {
        ip_address: 'captured',
        user_agent: navigator.userAgent,
        form_version: '1.0',
      };

      if (data.consentDataProcessing) {
        consents.push({
          lead_id: lead.id,
          type: 'data_processing',
          status: 'granted',
          jurisdiction: locale === 'fr' ? 'ca_qc' : 'ca_on',
          purpose: 'Lead qualification and automotive sales communication',
          granted_at: now,
          channel: 'web_form',
          metadata: consentMetadata,
        });
      }

      if (data.consentMarketing) {
        consents.push({
          lead_id: lead.id,
          type: 'marketing',
          status: 'granted',
          jurisdiction: locale === 'fr' ? 'ca_qc' : 'ca_on',
          purpose: 'Marketing communications about vehicles and promotions',
          granted_at: now,
          channel: 'web_form',
          metadata: consentMetadata,
        });
      }

      if (data.consentSms) {
        consents.push({
          lead_id: lead.id,
          type: 'sms',
          status: 'granted',
          jurisdiction: locale === 'fr' ? 'ca_qc' : 'ca_on',
          purpose: 'SMS notifications and updates',
          granted_at: now,
          channel: 'web_form',
          metadata: consentMetadata,
        });
      }

      if (data.consentPhone) {
        consents.push({
          lead_id: lead.id,
          type: 'phone',
          status: 'granted',
          jurisdiction: locale === 'fr' ? 'ca_qc' : 'ca_on',
          purpose: 'Phone calls for sales and service',
          granted_at: now,
          channel: 'web_form',
          metadata: consentMetadata,
        });
      }

      if (consents.length > 0) {
        const { error: consentError } = await supabase
          .from('consents')
          .insert(consents);

        if (consentError) {
          console.error('Consent recording error:', consentError);
          // Don't fail the lead creation if consent logging fails
        }
      }

      // Log interaction
      await supabase.from('interactions').insert({
        lead_id: lead.id,
        type: 'note',
        direction: 'inbound',
        subject: 'Lead Qualification Form Submitted',
        body: `Timeline: ${data.timeline}, Budget: ${data.budget || 'Not specified'}`,
        metadata: { form_data: data },
      });

      const duration = performance.now() - startTime;
      telemetry.trackPerformance('lead_qualification_submit', duration);
      telemetry.trackBusinessMetric('leads_qualified', 1, { dealership_id: dealershipId });

      toast({
        title: locale === 'fr' ? 'Succès!' : 'Success!',
        description: locale === 'fr' 
          ? 'Votre demande a été soumise. Nous vous contacterons bientôt!' 
          : 'Your inquiry has been submitted. We\'ll be in touch soon!',
      });

      form.reset();
      if (onSuccess) onSuccess(lead.id);

    } catch (error) {
      telemetry.error('Lead qualification form error', { dealership_id: dealershipId }, error as Error);
      toast({
        title: locale === 'fr' ? 'Erreur' : 'Error',
        description: locale === 'fr'
          ? 'Impossible de soumettre le formulaire. Veuillez réessayer.'
          : 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tradeIn = form.watch('tradeIn');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === 'fr' ? 'Parlez-nous de vous' : 'Tell Us About Yourself'}</CardTitle>
        <CardDescription>
          {locale === 'fr' 
            ? 'Aidez-nous à comprendre vos besoins pour vous trouver le véhicule parfait.'
            : 'Help us understand your needs so we can find you the perfect vehicle.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Prénom' : 'First Name'} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Nom' : 'Last Name'} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Courriel' : 'Email'} *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>{locale === 'fr' ? 'Téléphone' : 'Phone'} *</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{locale === 'fr' ? 'Méthode de contact préférée' : 'Preferred Contact Method'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">{locale === 'fr' ? 'Courriel' : 'Email'}</SelectItem>
                      <SelectItem value="phone">{locale === 'fr' ? 'Téléphone' : 'Phone'}</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Interest */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{locale === 'fr' ? 'Intérêt pour le véhicule' : 'Vehicle Interest'}</h3>
              
              <FormField
                control={form.control}
                name="vehicleInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Véhicule d\'intérêt' : 'Vehicle of Interest'}</FormLabel>
                    <FormControl>
                      <Input placeholder={locale === 'fr' ? 'ex: Honda Civic 2024' : 'e.g., 2024 Honda Civic'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Budget' : 'Budget'}</FormLabel>
                    <FormControl>
                      <Input placeholder="$30,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === 'fr' ? 'Calendrier d\'achat' : 'Purchase Timeline'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">{locale === 'fr' ? 'Immédiat' : 'Immediate'}</SelectItem>
                        <SelectItem value="1-3months">{locale === 'fr' ? '1-3 mois' : '1-3 months'}</SelectItem>
                        <SelectItem value="3-6months">{locale === 'fr' ? '3-6 mois' : '3-6 months'}</SelectItem>
                        <SelectItem value="6+months">{locale === 'fr' ? '6+ mois' : '6+ months'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trade-In */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tradeIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {locale === 'fr' ? 'Avez-vous un véhicule à échanger?' : 'Do you have a trade-in?'}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {tradeIn && (
                <FormField
                  control={form.control}
                  name="tradeInDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === 'fr' ? 'Détails de l\'échange' : 'Trade-in Details'}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={locale === 'fr' ? 'Année, marque, modèle, kilométrage...' : 'Year, make, model, mileage...'}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{locale === 'fr' ? 'Notes additionnelles' : 'Additional Notes'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Consent Section */}
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {locale === 'fr' ? 'Consentements' : 'Consent & Privacy'}
                </h3>
              </div>

              <FormField
                control={form.control}
                name="consentDataProcessing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {locale === 'fr' 
                          ? 'Je consens au traitement de mes données personnelles à des fins de vente automobile et de communication. *'
                          : 'I consent to the processing of my personal information for automotive sales and communication purposes. *'}
                      </FormLabel>
                      <FormDescription>
                        {locale === 'fr'
                          ? 'Requis. Conformité PIPEDA/Loi 25.'
                          : 'Required. PIPEDA/Law-25 compliance.'}
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentMarketing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {locale === 'fr'
                          ? 'Je consens à recevoir des communications marketing par courriel.'
                          : 'I consent to receive marketing communications via email.'}
                      </FormLabel>
                      <FormDescription>
                        {locale === 'fr'
                          ? 'Optionnel. Conformité LCAP.'
                          : 'Optional. CASL compliance.'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentSms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {locale === 'fr'
                          ? 'Je consens à recevoir des notifications par SMS.'
                          : 'I consent to receive SMS notifications.'}
                      </FormLabel>
                      <FormDescription>
                        {locale === 'fr'
                          ? 'Optionnel. Conformité LCAP/TCPA.'
                          : 'Optional. CASL/TCPA compliance.'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentPhone"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {locale === 'fr'
                          ? 'Je consens à être contacté par téléphone.'
                          : 'I consent to be contacted by phone.'}
                      </FormLabel>
                      <FormDescription>
                        {locale === 'fr'
                          ? 'Optionnel. Conformité TCPA.'
                          : 'Optional. TCPA compliance.'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">
                {locale === 'fr'
                  ? 'Vous pouvez retirer votre consentement à tout moment. Voir notre politique de confidentialité pour plus de détails.'
                  : 'You can withdraw your consent at any time. See our privacy policy for details.'}
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                locale === 'fr' ? 'Soumission...' : 'Submitting...'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {locale === 'fr' ? 'Soumettre' : 'Submit Inquiry'}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
