/**
 * FCRA/GLBA/ESIGN Compliant Credit Application Form
 * 
 * Multi-step form with explicit consent capture and compliance disclosures
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, FileText, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { encryptCreditApplication } from '@/lib/security/creditEncryption';

const applicantSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$|^\d{9}$/, 'Invalid SSN/SIN format'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(1, 'City required'),
  province: z.string().min(2, 'Province/State required'),
  postalCode: z.string().min(5, 'Postal/ZIP code required'),
  employmentStatus: z.enum(['employed', 'self-employed', 'retired', 'other']),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.number().min(0, 'Income must be positive'),
  employmentLength: z.string().optional(),
});

const consentSchema = z.object({
  fcraConsent: z.boolean().refine(val => val === true, 'FCRA consent required'),
  glbaConsent: z.boolean().refine(val => val === true, 'GLBA consent required'),
  esignConsent: z.boolean().refine(val => val === true, 'E-SIGN consent required'),
  softPull: z.boolean(),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted'),
});

type ApplicantData = z.infer<typeof applicantSchema>;
type ConsentData = z.infer<typeof consentSchema>;

interface CreditApplicationFormProps {
  leadId: string;
  dealershipId: string;
  onComplete?: (applicationId: string) => void;
}

type FormStep = 'applicant' | 'employment' | 'consent' | 'review';

export function CreditApplicationForm({ leadId, dealershipId, onComplete }: CreditApplicationFormProps) {
  const [step, setStep] = useState<FormStep>('applicant');
  const [applicantData, setApplicantData] = useState<Partial<ApplicantData>>({});
  const [coApplicant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const applicantForm = useForm<ApplicantData>({
    resolver: zodResolver(applicantSchema),
    defaultValues: applicantData,
  });

  const consentForm = useForm<ConsentData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      softPull: true,
      fcraConsent: false,
      glbaConsent: false,
      esignConsent: false,
      termsAccepted: false,
    },
  });

  const handleApplicantSubmit = (data: ApplicantData) => {
    setApplicantData(data);
    setStep('employment');
  };

  const handleEmploymentSubmit = () => {
    setStep('consent');
  };

  const handleConsentSubmit = async (_consentData: ConsentData) => {
    setStep('review');
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare applicant data
      const rawApplicantData = {
        ...applicantData,
        ...applicantForm.getValues(),
      };

      // Encrypt sensitive fields
      const { 
        applicant_data: encryptedApplicantData, 
        encrypted_fields, 
        encryption_key_id 
      } = await encryptCreditApplication(rawApplicantData);

      const applicationData = {
        lead_id: leadId,
        dealership_id: dealershipId,
        submitted_by: user?.id,
        applicant_data: encryptedApplicantData,
        co_applicant_data: coApplicant ? {} : null,
        employment_data: {
          status: applicantForm.getValues().employmentStatus,
          employer: applicantForm.getValues().employer,
          jobTitle: applicantForm.getValues().jobTitle,
          monthlyIncome: applicantForm.getValues().monthlyIncome,
          employmentLength: applicantForm.getValues().employmentLength,
        },
        status: 'submitted' as const,
        soft_pull: consentForm.getValues().softPull,
        consent_timestamp: new Date().toISOString(),
        encrypted_fields,
        encryption_key_id,
      };

      const { data: application, error: appError } = await supabase
        .from('credit_applications')
        .insert([applicationData])
        .select()
        .single();

      if (appError) throw appError;

      let clientIp = 'unknown';
      try {
        const { data: ipData } = await supabase.functions.invoke('capture-client-ip');
        clientIp = ipData?.ip || 'unknown';
      } catch (ipError) {
        // IP capture failed, continue with unknown
      }

      // Record consent proofs
      const consents = [
        {
          lead_id: leadId,
          type: 'credit_check' as const,
          status: 'granted' as const,
          jurisdiction: 'us' as const,
          purpose: 'FCRA credit inquiry authorization',
          granted_at: new Date().toISOString(),
          consent_ip: clientIp,
          user_agent: navigator.userAgent,
          metadata: {
            fcra_consent: true,
            soft_pull: consentForm.getValues().softPull,
          },
        },
        {
          lead_id: leadId,
          type: 'data_processing' as const,
          status: 'granted' as const,
          jurisdiction: 'us' as const,
          purpose: 'GLBA financial information sharing',
          granted_at: new Date().toISOString(),
          metadata: {
            glba_consent: true,
          },
        },
        {
          lead_id: leadId,
          type: 'esign' as const,
          status: 'granted' as const,
          jurisdiction: 'us' as const,
          purpose: 'ESIGN Act electronic signature consent',
          granted_at: new Date().toISOString(),
          metadata: {
            esign_consent: true,
          },
        },
      ];

      const { error: consentError } = await supabase
        .from('consents')
        .insert(consents);

      if (consentError) throw consentError;

      toast.success('Credit application submitted successfully');
      onComplete?.(application.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit credit application';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'applicant' || step === 'employment') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'applicant' ? 'Applicant Information' : 'Employment Information'}
          </CardTitle>
          <CardDescription>
            {step === 'applicant' 
              ? 'Please provide your personal information' 
              : 'Please provide your employment details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applicantForm.handleSubmit(step === 'applicant' ? handleApplicantSubmit : handleEmploymentSubmit)} className="space-y-4">
            {step === 'applicant' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input {...applicantForm.register('firstName')} />
                    {applicantForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input {...applicantForm.register('lastName')} />
                    {applicantForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input type="date" {...applicantForm.register('dateOfBirth')} />
                    {applicantForm.formState.errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">SSN/SIN *</Label>
                    <Input type="password" placeholder="XXX-XX-XXXX" {...applicantForm.register('ssn')} />
                    {applicantForm.formState.errors.ssn && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.ssn.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input type="email" {...applicantForm.register('email')} />
                    {applicantForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input type="tel" {...applicantForm.register('phone')} />
                    {applicantForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">{applicantForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input {...applicantForm.register('address')} />
                  {applicantForm.formState.errors.address && (
                    <p className="text-sm text-destructive">{applicantForm.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input {...applicantForm.register('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province/State *</Label>
                    <Input {...applicantForm.register('province')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal/ZIP Code *</Label>
                    <Input {...applicantForm.register('postalCode')} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <select 
                    {...applicantForm.register('employmentStatus')} 
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Select status</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="retired">Retired</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employer">Employer</Label>
                  <Input {...applicantForm.register('employer')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input {...applicantForm.register('jobTitle')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income *</Label>
                    <Input 
                      type="number" 
                      {...applicantForm.register('monthlyIncome', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentLength">Length of Employment</Label>
                    <Input placeholder="e.g., 2 years" {...applicantForm.register('employmentLength')} />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              {step === 'employment' && (
                <Button type="button" variant="outline" onClick={() => setStep('applicant')}>
                  Back
                </Button>
              )}
              <Button type="submit" className="ml-auto">
                {step === 'applicant' ? 'Continue to Employment' : 'Continue to Consent'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === 'consent') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consent & Disclosures
          </CardTitle>
          <CardDescription>
            Please review and accept the required consents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={consentForm.handleSubmit(handleConsentSubmit)} className="space-y-6">
            {/* FCRA Disclosure */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="mt-2 text-sm">
                <strong>FCRA DISCLOSURE & AUTHORIZATION</strong>
                <p className="mt-2">
                  By checking the box below, you authorize us to obtain consumer reports and/or investigative consumer reports 
                  about you from one or more consumer reporting agencies, such as TransUnion, Experian, and Equifax, 
                  for the purpose of evaluating your credit application.
                </p>
                <p className="mt-2">
                  You understand that this authorization extends to obtaining such reports at any time while your application 
                  is pending or you have a credit relationship with us.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="fcraConsent" 
                {...consentForm.register('fcraConsent')}
              />
              <Label htmlFor="fcraConsent" className="text-sm font-normal leading-relaxed">
                I authorize the dealership to obtain my consumer credit report for the purpose of this credit application. *
              </Label>
            </div>

            {/* GLBA Disclosure */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="mt-2 text-sm">
                <strong>GLBA PRIVACY NOTICE</strong>
                <p className="mt-2">
                  We collect nonpublic personal information about you from credit applications and consumer reports. 
                  We may disclose this information to affiliates and nonaffiliated third parties as permitted by law, 
                  including to financial institutions with whom we have joint marketing agreements.
                </p>
                <p className="mt-2">
                  We maintain physical, electronic, and procedural safeguards to protect your information.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="glbaConsent" 
                {...consentForm.register('glbaConsent')}
              />
              <Label htmlFor="glbaConsent" className="text-sm font-normal leading-relaxed">
                I acknowledge receipt of the GLBA Privacy Notice and consent to the sharing of my financial information as described. *
              </Label>
            </div>

            {/* ESIGN Disclosure */}
            <Alert>
              <UserCheck className="h-4 w-4" />
              <AlertDescription className="mt-2 text-sm">
                <strong>ELECTRONIC SIGNATURE CONSENT (ESIGN Act)</strong>
                <p className="mt-2">
                  By checking the box below, you consent to electronically sign this credit application and receive 
                  all disclosures and communications electronically. You have the right to withdraw this consent at any time.
                </p>
                <p className="mt-2">
                  To access electronic records, you will need a device with internet access and a current web browser.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="esignConsent" 
                {...consentForm.register('esignConsent')}
              />
              <Label htmlFor="esignConsent" className="text-sm font-normal leading-relaxed">
                I consent to use electronic signatures and receive documents electronically. *
              </Label>
            </div>

            {/* Soft Pull Option */}
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="softPull" 
                defaultChecked
                {...consentForm.register('softPull')}
              />
              <Label htmlFor="softPull" className="text-sm font-normal leading-relaxed">
                Perform soft credit inquiry (does not affect credit score)
              </Label>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="termsAccepted" 
                {...consentForm.register('termsAccepted')}
              />
              <Label htmlFor="termsAccepted" className="text-sm font-normal leading-relaxed">
                I certify that all information provided is true and accurate. *
              </Label>
            </div>

            {Object.keys(consentForm.formState.errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please accept all required consents to continue.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep('employment')}>
                Back
              </Button>
              <Button type="submit">
                Review Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Review step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Review & Submit
        </CardTitle>
        <CardDescription>
          Please review your application before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Applicant Information</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Name:</dt>
            <dd>{applicantData.firstName} {applicantData.lastName}</dd>
            <dt className="text-muted-foreground">Email:</dt>
            <dd>{applicantData.email}</dd>
            <dt className="text-muted-foreground">Phone:</dt>
            <dd>{applicantData.phone}</dd>
          </dl>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Employment</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Status:</dt>
            <dd>{applicantData.employmentStatus}</dd>
            <dt className="text-muted-foreground">Monthly Income:</dt>
            <dd>${applicantData.monthlyIncome?.toLocaleString()}</dd>
          </dl>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Consents</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              FCRA Authorization
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              GLBA Privacy Consent
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              ESIGN Electronic Signature
            </li>
          </ul>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            By submitting this application, you certify that all information is accurate and authorize 
            the dealership to process your credit application according to the consents provided.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => setStep('consent')}>
            Back
          </Button>
          <Button onClick={handleFinalSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
