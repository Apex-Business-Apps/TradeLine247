/**
 * OnboardingSteps Context
 * 
 * Provides step management for onboarding flows.
 * Defaults to 3 steps total.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingStepsContextType {
  step: number;
  total: number;
  percent: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const OnboardingStepsContext = createContext<OnboardingStepsContextType | undefined>(undefined);

interface OnboardingStepsProviderProps {
  children: ReactNode;
  initialStep?: number;
  totalSteps?: number;
}

export const OnboardingStepsProvider: React.FC<OnboardingStepsProviderProps> = ({
  children,
  initialStep = 1,
  totalSteps = 3,
}) => {
  const [step, setStep] = useState(initialStep);
  
  const percent = Math.round((step / totalSteps) * 100);
  
  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };
  
  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const reset = () => {
    setStep(initialStep);
  };
  
  return (
    <OnboardingStepsContext.Provider
      value={{
        step,
        total: totalSteps,
        percent,
        setStep,
        nextStep,
        previousStep,
        reset,
      }}
    >
      {children}
    </OnboardingStepsContext.Provider>
  );
};

export const useOnboardingSteps = (): OnboardingStepsContextType => {
  const context = useContext(OnboardingStepsContext);
  if (context === undefined) {
    throw new Error('useOnboardingSteps must be used within an OnboardingStepsProvider');
  }
  return context;
};

