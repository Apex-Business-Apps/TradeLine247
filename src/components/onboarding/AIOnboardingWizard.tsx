/**
 * AI Onboarding Wizard Component
 *
 * Multi-step wizard for configuring AI receptionist personality
 * and behavior based on business questionnaire.
 */

import * as React from "react";
import { useState } from "react";
import {
  Bot,
  Building2,
  Users,
  MessageSquare,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface AIProfileData {
  profileName: string;
  businessType: string;
  industry: string;
  companySize: string;
  targetAudience: string;
  toneStyle: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  communicationStyle: 'direct' | 'conversational' | 'detailed';
  empathyLevel: 'low' | 'moderate' | 'high';
  interruptionAllowed: boolean;
  patienceLevel: 'low' | 'moderate' | 'high';
  followUpStyle: 'aggressive' | 'gentle' | 'minimal';
  customInstructions: string;
}

interface AIOnboardingWizardProps {
  organizationId: string;
  onComplete: (profile: AIProfileData) => void;
  onCancel?: () => void;
}

const STEPS: WizardStep[] = [
  { id: 'business', title: 'Business Info', description: 'Tell us about your business', icon: <Building2 className="h-5 w-5" /> },
  { id: 'audience', title: 'Audience', description: 'Who are your customers?', icon: <Users className="h-5 w-5" /> },
  { id: 'tone', title: 'Tone & Style', description: 'How should we communicate?', icon: <MessageSquare className="h-5 w-5" /> },
  { id: 'behavior', title: 'Behavior', description: 'Fine-tune interactions', icon: <Zap className="h-5 w-5" /> },
  { id: 'review', title: 'Review', description: 'Confirm your settings', icon: <Check className="h-5 w-5" /> },
];

const INDUSTRIES = [
  'Healthcare', 'Legal', 'Real Estate', 'Home Services', 'Professional Services',
  'Retail', 'Hospitality', 'Automotive', 'Financial Services', 'Education', 'Other'
];

const COMPANY_SIZES = [
  '1-5 employees', '6-20 employees', '21-50 employees', '51-200 employees', '200+ employees'
];

export function AIOnboardingWizard({ organizationId, onComplete, onCancel }: AIOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileData, setProfileData] = useState<AIProfileData>({
    profileName: 'AI Receptionist',
    businessType: '',
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
  });

  const updateProfile = (updates: Partial<AIProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return profileData.businessType && profileData.industry && profileData.companySize;
      case 1:
        return profileData.targetAudience;
      case 2:
        return profileData.toneStyle && profileData.communicationStyle;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...profileData,
          customInstructions: profileData.customInstructions ? { notes: profileData.customInstructions } : {},
        }),
      });

      if (response.ok) {
        onComplete(profileData);
      }
    } catch (error) {
      console.error('Failed to generate AI profile:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                placeholder="e.g., Main Receptionist"
                value={profileData.profileName}
                onChange={(e) => updateProfile({ profileName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                placeholder="e.g., Dental Practice, Law Firm, HVAC Company"
                value={profileData.businessType}
                onChange={(e) => updateProfile({ businessType: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <RadioGroup
                value={profileData.industry}
                onValueChange={(v) => updateProfile({ industry: v })}
                className="grid grid-cols-2 gap-2"
              >
                {INDUSTRIES.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <RadioGroupItem value={industry} id={industry} />
                    <Label htmlFor={industry} className="font-normal">{industry}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>
              <RadioGroup
                value={profileData.companySize}
                onValueChange={(v) => updateProfile({ companySize: v })}
              >
                {COMPANY_SIZES.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem value={size} id={size} />
                    <Label htmlFor={size} className="font-normal">{size}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Describe Your Typical Customers</Label>
              <Textarea
                id="targetAudience"
                placeholder="e.g., Homeowners ages 30-60 looking for reliable home services, busy professionals who value convenience..."
                value={profileData.targetAudience}
                onChange={(e) => updateProfile({ targetAudience: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This helps us tailor the AI's communication style to your audience.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Tone Style</Label>
              <div className="grid gap-3">
                {[
                  { value: 'professional', label: 'Professional', desc: 'Business-like and polished' },
                  { value: 'friendly', label: 'Friendly', desc: 'Warm and personable' },
                  { value: 'formal', label: 'Formal', desc: 'Traditional and respectful' },
                  { value: 'casual', label: 'Casual', desc: 'Relaxed and conversational' },
                  { value: 'empathetic', label: 'Empathetic', desc: 'Understanding and compassionate' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors",
                      profileData.toneStyle === option.value && "border-primary bg-primary/5"
                    )}
                    onClick={() => updateProfile({ toneStyle: option.value as AIProfileData['toneStyle'] })}
                  >
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                    {profileData.toneStyle === option.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Communication Style</Label>
              <div className="grid gap-3">
                {[
                  { value: 'direct', label: 'Direct', desc: 'Concise and to the point' },
                  { value: 'conversational', label: 'Conversational', desc: 'Natural back-and-forth dialogue' },
                  { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors",
                      profileData.communicationStyle === option.value && "border-primary bg-primary/5"
                    )}
                    onClick={() => updateProfile({ communicationStyle: option.value as AIProfileData['communicationStyle'] })}
                  >
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                    {profileData.communicationStyle === option.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Empathy Level</Label>
              <RadioGroup
                value={profileData.empathyLevel}
                onValueChange={(v) => updateProfile({ empathyLevel: v as AIProfileData['empathyLevel'] })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="empathy-low" />
                  <Label htmlFor="empathy-low" className="font-normal">Low - Focus on facts and solutions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="empathy-moderate" />
                  <Label htmlFor="empathy-moderate" className="font-normal">Moderate - Acknowledge feelings, stay focused</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="empathy-high" />
                  <Label htmlFor="empathy-high" className="font-normal">High - Prioritize emotional connection</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Allow Interruptions</p>
                <p className="text-sm text-muted-foreground">Can the AI politely interject to clarify or redirect?</p>
              </div>
              <Switch
                checked={profileData.interruptionAllowed}
                onCheckedChange={(checked) => updateProfile({ interruptionAllowed: checked })}
              />
            </div>

            <div className="space-y-4">
              <Label>Patience Level</Label>
              <RadioGroup
                value={profileData.patienceLevel}
                onValueChange={(v) => updateProfile({ patienceLevel: v as AIProfileData['patienceLevel'] })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="patience-low" />
                  <Label htmlFor="patience-low" className="font-normal">Low - Move conversations quickly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="patience-moderate" />
                  <Label htmlFor="patience-moderate" className="font-normal">Moderate - Balanced pacing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="patience-high" />
                  <Label htmlFor="patience-high" className="font-normal">High - Take time, never rush</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Follow-up Style</Label>
              <RadioGroup
                value={profileData.followUpStyle}
                onValueChange={(v) => updateProfile({ followUpStyle: v as AIProfileData['followUpStyle'] })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aggressive" id="followup-aggressive" />
                  <Label htmlFor="followup-aggressive" className="font-normal">Proactive - Suggest next steps</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gentle" id="followup-gentle" />
                  <Label htmlFor="followup-gentle" className="font-normal">Gentle - Offer help when appropriate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="followup-minimal" />
                  <Label htmlFor="followup-minimal" className="font-normal">Minimal - Wait for caller to ask</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="customInstructions"
                placeholder="Any specific instructions or phrases you'd like the AI to use or avoid..."
                value={profileData.customInstructions}
                onChange={(e) => updateProfile({ customInstructions: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4">
              <h4 className="font-medium">Profile Summary</h4>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Name:</span>
                  <span className="font-medium">{profileData.profileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">{profileData.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="font-medium">{profileData.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tone:</span>
                  <span className="font-medium capitalize">{profileData.toneStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Communication:</span>
                  <span className="font-medium capitalize">{profileData.communicationStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empathy:</span>
                  <span className="font-medium capitalize">{profileData.empathyLevel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-sm">
                We'll use AI to generate a custom system prompt based on your preferences.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>AI Receptionist Setup</CardTitle>
            <CardDescription>Configure your AI assistant's personality</CardDescription>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-1 text-xs",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{STEPS[currentStep].title}</h3>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
        </div>

        {renderStepContent()}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Profile
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIOnboardingWizard;
