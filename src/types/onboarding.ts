export interface OnboardingProvisionRequest {
  userId: string;
  userEmail: string;
  userLocation?: string; // ISO country code (US, CA, etc.)
}

export interface OnboardingProvisionResponse {
  phoneNumber: string;
  twilioAccountSid: string;
  tenantId: string;
}

export interface OnboardingError {
  error: string;
  details?: string;
}

export type OnboardingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: OnboardingProvisionResponse }
  | { status: 'error'; error: string };

// Legacy types for backward compatibility
export interface ClientRecord {
  id: string;
  user_id: string;
  tenant_id: string;
  business_name?: string;
  legal_address?: string;
  contact_email: string;
  fallback_number?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string; // Encrypted
  phone_number?: string;
  created_at: string;
}

// Component props interfaces
export interface AddNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: string) => void;
}

export interface OnboardingSuccessProps {
  phoneNumber: string;
  onContinue?: () => void;
  className?: string;
}

// API response types
export interface ProvisioningResult {
  success: boolean;
  phoneNumber?: string;
  twilioAccountSid?: string;
  tenantId?: string;
  error?: string;
}

// Analytics event types
export interface OnboardingAnalyticsEvent {
  event: 'onboarding_started' | 'onboarding_completed' | 'onboarding_failed';
  properties: {
    userId: string;
    timestamp: string;
    duration?: number;
    error?: string;
    phoneNumber?: string;
    tenantId?: string;
  };
}
