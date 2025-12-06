import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Building,
  Users,
  MessageSquare,
  Heart,
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profileId: string) => void;
}

interface OnboardingData {
  // Step 1: Business Basics
  businessName: string;
  industry: string;
  companySize: string;
  targetAudience: string;

  // Step 2: Communication Style
  toneStyle: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  communicationStyle: 'direct' | 'conversational' | 'detailed';
  empathyLevel: 'low' | 'moderate' | 'high';

  // Step 3: Behavioral Preferences
  interruptionAllowed: boolean;
  patienceLevel: 'low' | 'moderate' | 'high';
  followUpStyle: 'gentle' | 'firm' | 'aggressive';

  // Step 4: Custom Instructions
  customInstructions: string;
  businessHours: string;
  specialNotes: string;
}

const INDUSTRIES = [
  'Healthcare', 'Legal Services', 'Financial Services', 'Real Estate',
  'Construction', 'Retail', 'Hospitality', 'Technology', 'Education',
  'Manufacturing', 'Consulting', 'Other'
];

const COMPANY_SIZES = [
  '1-5 employees', '6-20 employees', '21-100 employees',
  '101-500 employees', '500+ employees'
];

const TARGET_AUDIENCES = [
  'Individual Consumers', 'Small Businesses', 'Enterprise Clients',
  'General Public', 'Specific Demographics'
];

const TONE_STYLES = [
  {
    value: 'professional' as const,
    label: 'Professional',
    description: 'Formal, polished, and business-appropriate',
    example: '"Thank you for calling. How may I assist you today?"'
  },
  {
    value: 'friendly' as const,
    label: 'Friendly',
    description: 'Warm, approachable, and personable',
    example: '"Hi there! Thanks for reaching out. What can I help you with?"'
  },
  {
    value: 'formal' as const,
    label: 'Formal',
    description: 'Traditional, respectful, and structured',
    example: '"Good day. I am pleased to assist you with your inquiry."'
  },
  {
    value: 'casual' as const,
    label: 'Casual',
    description: 'Relaxed, conversational, and informal',
    example: '"Hey! What\'s up? How can I help you out today?"'
  },
  {
    value: 'empathetic' as const,
    label: 'Empathetic',
    description: 'Caring, understanding, and emotionally attuned',
    example: '"I can hear this is important to you. Let\'s work through this together."'
  }
];

const COMMUNICATION_STYLES = [
  {
    value: 'direct' as const,
    label: 'Direct',
    description: 'Straightforward and to-the-point'
  },
  {
    value: 'conversational' as const,
    label: 'Conversational',
    description: 'Natural, flowing dialogue'
  },
  {
    value: 'detailed' as const,
    label: 'Detailed',
    description: 'Comprehensive and thorough explanations'
  }
];

export function AIOnboardingWizard({ open, onOpenChange, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    industry: '',
    companySize: '',
    targetAudience: '',
    toneStyle: 'professional',
    communicationStyle: 'conversational',
    empathyLevel: 'moderate',
    interruptionAllowed: false,
    patienceLevel: 'moderate',
    followUpStyle: 'gentle',
    customInstructions: '',
    businessHours: '',
    specialNotes: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Create AI profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: OnboardingData) => {
      const { data, error } = await supabase.functions.invoke('generate-ai-profile', {
        body: profileData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      toast.success('AI personality created successfully!');
      onComplete(result.profileId);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create AI personality');
      console.error('Profile creation error:', error);
    },
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    createProfileMutation.mutate(data);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.businessName && data.industry && data.companySize && data.targetAudience;
      case 2:
        return data.toneStyle && data.communicationStyle && data.empathyLevel;
      case 3:
        return true; // Optional preferences
      case 4:
        return data.businessHours; // At least business hours
      case 5:
        return true; // Preview step
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Tell us about your business</h3>
              <p className="text-muted-foreground">
                This helps us customize your AI receptionist to match your brand and industry.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Acme Plumbing Services"
                  value={data.businessName}
                  onChange={(e) => updateData('businessName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <select
                  id="industry"
                  value={data.industry}
                  onChange={(e) => updateData('industry', e.target.value)}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <select
                  id="companySize"
                  value={data.companySize}
                  onChange={(e) => updateData('companySize', e.target.value)}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="targetAudience">Primary Audience *</Label>
                <select
                  id="targetAudience"
                  value={data.targetAudience}
                  onChange={(e) => updateData('targetAudience', e.target.value)}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select your primary audience</option>
                  {TARGET_AUDIENCES.map(audience => (
                    <option key={audience} value={audience}>{audience}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Communication Style</h3>
              <p className="text-muted-foreground">
                Choose how your AI receptionist should communicate with callers.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Tone Style *</Label>
                <RadioGroup
                  value={data.toneStyle}
                  onValueChange={(value) => updateData('toneStyle', value)}
                  className="mt-3 space-y-3"
                >
                  {TONE_STYLES.map(style => (
                    <div key={style.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={style.value} className="font-medium cursor-pointer">
                          {style.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">Example: {style.example}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Communication Style *</Label>
                <RadioGroup
                  value={data.communicationStyle}
                  onValueChange={(value) => updateData('communicationStyle', value)}
                  className="mt-3 space-y-3"
                >
                  {COMMUNICATION_STYLES.map(style => (
                    <div key={style.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={style.value} className="font-medium cursor-pointer">
                          {style.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Empathy Level *</Label>
                <div className="mt-3 space-y-2">
                  <RadioGroup
                    value={data.empathyLevel}
                    onValueChange={(value) => updateData('empathyLevel', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="empathy-low" />
                      <Label htmlFor="empathy-low">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="empathy-moderate" />
                      <Label htmlFor="empathy-moderate">Moderate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="empathy-high" />
                      <Label htmlFor="empathy-high">High</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    How emotionally attuned should your AI be to caller feelings?
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Behavioral Preferences</h3>
              <p className="text-muted-foreground">
                Fine-tune how your AI handles conversations and follow-ups.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="interruption"
                  checked={data.interruptionAllowed}
                  onCheckedChange={(checked) => updateData('interruptionAllowed', checked)}
                />
                <div>
                  <Label htmlFor="interruption" className="font-medium cursor-pointer">
                    Allow AI to interrupt callers
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable if your AI should speak over callers in urgent situations
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Patience Level</Label>
                <div className="mt-3">
                  <RadioGroup
                    value={data.patienceLevel}
                    onValueChange={(value) => updateData('patienceLevel', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="patience-low" />
                      <Label htmlFor="patience-low">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="patience-moderate" />
                      <Label htmlFor="patience-moderate">Moderate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="patience-high" />
                      <Label htmlFor="patience-high">High</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-2">
                    How long should the AI wait for responses before following up?
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Follow-up Style</Label>
                <div className="mt-3">
                  <RadioGroup
                    value={data.followUpStyle}
                    onValueChange={(value) => updateData('followUpStyle', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gentle" id="followup-gentle" />
                      <Label htmlFor="followup-gentle">Gentle</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="firm" id="followup-firm" />
                      <Label htmlFor="followup-firm">Firm</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aggressive" id="followup-aggressive" />
                      <Label htmlFor="followup-aggressive">Aggressive</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-2">
                    How persistent should the AI be when following up on unanswered questions?
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Business Details</h3>
              <p className="text-muted-foreground">
                Help your AI provide accurate information and handle scheduling.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessHours">Business Hours *</Label>
                <Textarea
                  id="businessHours"
                  placeholder="e.g., Monday-Friday 9am-6pm, Saturday 10am-4pm, Sunday Closed"
                  value={data.businessHours}
                  onChange={(e) => updateData('businessHours', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  placeholder="e.g., Always mention our 10% first-time customer discount, or handle Spanish-speaking callers specially"
                  value={data.customInstructions}
                  onChange={(e) => updateData('customInstructions', e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="specialNotes">Special Notes or Restrictions</Label>
                <Textarea
                  id="specialNotes"
                  placeholder="e.g., Don't book appointments on holidays, or always ask about preferred technicians"
                  value={data.specialNotes}
                  onChange={(e) => updateData('specialNotes', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Review Your AI Personality</h3>
              <p className="text-muted-foreground">
                Here's a preview of how your AI receptionist will behave.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {data.businessName || 'Your Business'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                    <p className="font-medium">{data.industry}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Company Size</Label>
                    <p className="font-medium">{data.companySize}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tone</Label>
                    <Badge variant="secondary">{data.toneStyle}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Communication</Label>
                    <Badge variant="secondary">{data.communicationStyle}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Empathy</Label>
                    <Badge variant="secondary">{data.empathyLevel}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Patience</Label>
                    <Badge variant="secondary">{data.patienceLevel}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Business Hours</Label>
                  <p className="text-sm mt-1">{data.businessHours || 'Not specified'}</p>
                </div>

                {data.customInstructions && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Custom Instructions</Label>
                    <p className="text-sm mt-1">{data.customInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Sample Greeting:</h4>
              <p className="text-sm italic">
                {generateSampleGreeting(data)}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const generateSampleGreeting = (profile: OnboardingData): string => {
    const greetings = {
      professional: `Thank you for calling ${profile.businessName}. How may I assist you today?`,
      friendly: `Hi there! Thanks for reaching out to ${profile.businessName}. What can I help you with?`,
      formal: `Good day. You have reached ${profile.businessName}. How may I be of service?`,
      casual: `Hey! Welcome to ${profile.businessName}. What's up?`,
      empathetic: `Hello! I'm here at ${profile.businessName} and I'd love to help. What's on your mind?`
    };

    return greetings[profile.toneStyle] || greetings.professional;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Customize Your AI Receptionist
          </DialogTitle>
          <DialogDescription>
            Create a personalized AI personality that matches your business style and customer needs.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={createProfileMutation.isPending}
              >
                {createProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}