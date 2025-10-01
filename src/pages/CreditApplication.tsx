import { useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ConsentManager } from '@/components/Compliance/ConsentManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, User, Users, Briefcase, FileText, Shield } from 'lucide-react';

type ApplicationStep = 'applicant' | 'co-applicant' | 'employment' | 'consent' | 'review';

export default function CreditApplication() {
  const { toast } = useToast();
  const [step, setStep] = useState<ApplicationStep>('applicant');
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [softPull, setSoftPull] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [applicantData, setApplicantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sin: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    residenceType: '',
    monthlyRent: '',
  });

  const [coApplicantData, setCoApplicantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sin: '',
  });

  const [employmentData, setEmploymentData] = useState({
    employerName: '',
    occupation: '',
    employmentType: '',
    yearsEmployed: '',
    monthlyIncome: '',
    additionalIncome: '',
  });

  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get dealership info
      const { data: profile } = await supabase
        .from('profiles')
        .select('dealership_id')
        .eq('id', user.id)
        .single();

      const creditApp = {
        lead_id: null, // TODO: Link to actual lead
        dealership_id: profile?.dealership_id,
        submitted_by: user.id,
        status: 'submitted' as 'draft' | 'submitted' | 'approved' | 'declined' | 'pending' | 'more_info_needed',
        applicant_data: applicantData,
        co_applicant_data: hasCoApplicant ? coApplicantData : null,
        employment_data: employmentData,
        soft_pull: softPull,
        consent_timestamp: new Date().toISOString(),
        consent_ip: 'client-ip', // TODO: Get from edge function
        metadata: {
          has_co_applicant: hasCoApplicant,
          submission_timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          consents
        }
      };

      const { error } = await supabase
        .from('credit_applications')
        .insert([creditApp]);

      if (error) throw error;

      toast({
        title: 'Application Submitted',
        description: 'Your credit application has been submitted successfully. We\'ll be in touch soon.',
      });

      // Audit log
      await supabase.from('audit_events').insert({
        event_type: 'credit_app_submitted',
        action: 'submit_credit_application',
        user_id: user.id,
        resource_type: 'credit_application',
        metadata: { soft_pull: softPull }
      });

    } catch (error) {
      console.error('Error submitting credit application:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'applicant':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Primary Applicant Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={applicantData.firstName}
                  onChange={(e) => setApplicantData({...applicantData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={applicantData.lastName}
                  onChange={(e) => setApplicantData({...applicantData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicantData.email}
                  onChange={(e) => setApplicantData({...applicantData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={applicantData.phone}
                  onChange={(e) => setApplicantData({...applicantData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={applicantData.dateOfBirth}
                  onChange={(e) => setApplicantData({...applicantData, dateOfBirth: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sin">SIN / SSN *</Label>
                <Input
                  id="sin"
                  type="text"
                  placeholder="XXX-XXX-XXX"
                  value={applicantData.sin}
                  onChange={(e) => setApplicantData({...applicantData, sin: e.target.value})}
                  required
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={applicantData.address}
                onChange={(e) => setApplicantData({...applicantData, address: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={applicantData.city}
                  onChange={(e) => setApplicantData({...applicantData, city: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select
                  value={applicantData.province}
                  onValueChange={(value) => setApplicantData({...applicantData, province: value})}
                >
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON">Ontario</SelectItem>
                    <SelectItem value="QC">Quebec</SelectItem>
                    <SelectItem value="BC">British Columbia</SelectItem>
                    <SelectItem value="AB">Alberta</SelectItem>
                    <SelectItem value="SK">Saskatchewan</SelectItem>
                    <SelectItem value="MB">Manitoba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="A1A 1A1"
                  value={applicantData.postalCode}
                  onChange={(e) => setApplicantData({...applicantData, postalCode: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="coApplicant"
                checked={hasCoApplicant}
                onCheckedChange={(checked) => setHasCoApplicant(checked as boolean)}
              />
              <Label htmlFor="coApplicant">Add Co-Applicant</Label>
            </div>
          </div>
        );

      case 'co-applicant':
        return hasCoApplicant ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Co-Applicant Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coFirstName">First Name *</Label>
                <Input
                  id="coFirstName"
                  value={coApplicantData.firstName}
                  onChange={(e) => setCoApplicantData({...coApplicantData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="coLastName">Last Name *</Label>
                <Input
                  id="coLastName"
                  value={coApplicantData.lastName}
                  onChange={(e) => setCoApplicantData({...coApplicantData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coEmail">Email *</Label>
                <Input
                  id="coEmail"
                  type="email"
                  value={coApplicantData.email}
                  onChange={(e) => setCoApplicantData({...coApplicantData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="coPhone">Phone *</Label>
                <Input
                  id="coPhone"
                  type="tel"
                  value={coApplicantData.phone}
                  onChange={(e) => setCoApplicantData({...coApplicantData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coDob">Date of Birth *</Label>
                <Input
                  id="coDob"
                  type="date"
                  value={coApplicantData.dateOfBirth}
                  onChange={(e) => setCoApplicantData({...coApplicantData, dateOfBirth: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="coSin">SIN / SSN *</Label>
                <Input
                  id="coSin"
                  type="text"
                  placeholder="XXX-XXX-XXX"
                  value={coApplicantData.sin}
                  onChange={(e) => setCoApplicantData({...coApplicantData, sin: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        ) : null;

      case 'employment':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Employment & Income</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employer">Employer Name *</Label>
                <Input
                  id="employer"
                  value={employmentData.employerName}
                  onChange={(e) => setEmploymentData({...employmentData, employerName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  value={employmentData.occupation}
                  onChange={(e) => setEmploymentData({...employmentData, occupation: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={employmentData.employmentType}
                  onValueChange={(value) => setEmploymentData({...employmentData, employmentType: value})}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearsEmployed">Years Employed *</Label>
                <Input
                  id="yearsEmployed"
                  type="number"
                  min="0"
                  value={employmentData.yearsEmployed}
                  onChange={(e) => setEmploymentData({...employmentData, yearsEmployed: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (Gross) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min="0"
                  placeholder="$"
                  value={employmentData.monthlyIncome}
                  onChange={(e) => setEmploymentData({...employmentData, monthlyIncome: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="additionalIncome">Additional Income (Optional)</Label>
                <Input
                  id="additionalIncome"
                  type="number"
                  min="0"
                  placeholder="$"
                  value={employmentData.additionalIncome}
                  onChange={(e) => setEmploymentData({...employmentData, additionalIncome: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Consent & Authorization</h3>
            </div>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="softPull"
                  checked={softPull}
                  onCheckedChange={(checked) => setSoftPull(checked as boolean)}
                />
                <Label htmlFor="softPull" className="font-medium">
                  Soft Credit Pull (Recommended)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                A soft pull does not affect your credit score. We'll only perform a hard pull if you proceed with financing.
              </p>
            </div>

            <ConsentManager
              jurisdiction="ca_on"
              onConsentsUpdated={(c) => setConsents(c)}
            />

            <div className="space-y-3 text-sm p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <p className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FCRA Disclosure Notice
              </p>
              <p>
                By submitting this application, you authorize us to obtain your credit report for the permissible purpose 
                of evaluating your credit application. You have the right to request disclosure of the nature and scope 
                of any investigation.
              </p>
              <p>
                <strong>GLBA Notice:</strong> We protect your personal information using industry-standard security measures.
              </p>
              <p>
                <strong>ESIGN Consent:</strong> By submitting electronically, you consent to conduct this transaction 
                using electronic records and signatures.
              </p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Application</h3>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Primary Applicant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Name:</strong> {applicantData.firstName} {applicantData.lastName}</p>
                <p><strong>Email:</strong> {applicantData.email}</p>
                <p><strong>Phone:</strong> {applicantData.phone}</p>
                <p><strong>Address:</strong> {applicantData.address}, {applicantData.city}, {applicantData.province} {applicantData.postalCode}</p>
              </CardContent>
            </Card>

            {hasCoApplicant && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Co-Applicant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {coApplicantData.firstName} {coApplicantData.lastName}</p>
                  <p><strong>Email:</strong> {coApplicantData.email}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Employer:</strong> {employmentData.employerName}</p>
                <p><strong>Occupation:</strong> {employmentData.occupation}</p>
                <p><strong>Monthly Income:</strong> ${employmentData.monthlyIncome}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credit Check Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {softPull ? 'Soft Pull (No impact on credit score)' : 'Hard Pull (May impact credit score)'}
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const steps: ApplicationStep[] = ['applicant', 'co-applicant', 'employment', 'consent', 'review'];
  const currentStepIndex = steps.indexOf(step);
  const filteredSteps = hasCoApplicant ? steps : steps.filter(s => s !== 'co-applicant');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Credit Application
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete your credit application securely. All information is encrypted and handled in compliance with FCRA, GLBA, and PIPEDA.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {filteredSteps.map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                filteredSteps.indexOf(step) >= idx 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background border-muted-foreground/30'
              }`}>
                {idx + 1}
              </div>
              {idx < filteredSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  filteredSteps.indexOf(step) > idx ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = filteredSteps.indexOf(step);
              if (currentIndex > 0) {
                setStep(filteredSteps[currentIndex - 1]);
              }
            }}
            disabled={filteredSteps.indexOf(step) === 0}
          >
            Previous
          </Button>

          {step === 'review' ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const currentIndex = filteredSteps.indexOf(step);
                if (currentIndex < filteredSteps.length - 1) {
                  setStep(filteredSteps[currentIndex + 1]);
                }
              }}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
