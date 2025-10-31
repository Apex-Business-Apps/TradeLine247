/**
 * Personalized Welcome Dialog
 *
 * A multi-step onboarding wizard that guides new users through the dashboard.
 * Features:
 * - Personalized greeting
 * - Feature highlights
 * - Preference setup
 * - Interactive tutorial
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { Sparkles, Layout, Palette, Check } from 'lucide-react';

interface PersonalizedWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PersonalizedWelcomeDialog: React.FC<PersonalizedWelcomeDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');

  const {
    setOnboardingCompleted,
    setPreferredName,
    setDashboardLayout,
    setTheme,
    updateLastLogin,
  } = useUserPreferencesStore();

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save all preferences
    if (name) setPreferredName(name);
    setDashboardLayout(selectedLayout);
    setTheme(selectedTheme);
    setOnboardingCompleted(true);
    updateLastLogin();

    // Close dialog
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
                <Sparkles className="h-12 w-12 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <DialogTitle className="text-2xl font-bold">Welcome to TradeLine247!</DialogTitle>
              <DialogDescription className="text-base">
                Your AI receptionist is ready to help you capture every opportunity.
                Let's personalize your experience in just a few steps.
              </DialogDescription>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-xl font-bold">What should we call you?</DialogTitle>
              <DialogDescription>
                We'll use this to personalize your dashboard greeting.
              </DialogDescription>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Preferred Name</Label>
              <Input
                id="name"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Don't worry, you can change this anytime in settings.
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <Layout className="h-10 w-10 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-bold">Choose Your Layout</DialogTitle>
              <DialogDescription>
                How would you like your dashboard to look?
              </DialogDescription>
            </div>
            <RadioGroup value={selectedLayout} onValueChange={(value: any) => setSelectedLayout(value)}>
              <div className="space-y-3">
                <Label
                  htmlFor="compact"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedLayout === 'compact' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="compact" id="compact" />
                  <div className="flex-1">
                    <div className="font-medium">Compact</div>
                    <div className="text-sm text-muted-foreground">More info in less space</div>
                  </div>
                </Label>

                <Label
                  htmlFor="comfortable"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedLayout === 'comfortable' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="comfortable" id="comfortable" />
                  <div className="flex-1">
                    <div className="font-medium">Comfortable (Recommended)</div>
                    <div className="text-sm text-muted-foreground">Balanced spacing and readability</div>
                  </div>
                </Label>

                <Label
                  htmlFor="spacious"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedLayout === 'spacious' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="spacious" id="spacious" />
                  <div className="flex-1">
                    <div className="font-medium">Spacious</div>
                    <div className="text-sm text-muted-foreground">Maximum breathing room</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <Palette className="h-10 w-10 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-bold">Pick Your Theme</DialogTitle>
              <DialogDescription>
                Choose the appearance that works best for you.
              </DialogDescription>
            </div>
            <RadioGroup value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)}>
              <div className="space-y-3">
                <Label
                  htmlFor="light"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedTheme === 'light' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="light" id="light" />
                  <div className="flex-1">
                    <div className="font-medium">Light</div>
                    <div className="text-sm text-muted-foreground">Bright and clean</div>
                  </div>
                </Label>

                <Label
                  htmlFor="dark"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedTheme === 'dark' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="dark" id="dark" />
                  <div className="flex-1">
                    <div className="font-medium">Dark</div>
                    <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                  </div>
                </Label>

                <Label
                  htmlFor="system"
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  style={{ borderColor: selectedTheme === 'system' ? 'hsl(var(--primary))' : 'transparent' }}
                >
                  <RadioGroupItem value="system" id="system" />
                  <div className="flex-1">
                    <div className="font-medium">System (Recommended)</div>
                    <div className="text-sm text-muted-foreground">Matches your device settings</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome</DialogTitle>
        </DialogHeader>

        {renderStepContent()}

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i + 1 === step
                  ? 'bg-primary w-6'
                  : i + 1 < step
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gap-2">
              <Check className="h-4 w-4" />
              Complete Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
