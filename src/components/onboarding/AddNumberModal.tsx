import React, { useState } from 'react';
import { IonButton, IonSpinner, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { callOutline, checkmarkCircleOutline, close, alertCircle } from 'ionicons/icons';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OnboardingState {
  idle: boolean;
  loading: boolean;
  success: boolean;
  error: boolean;
  phoneNumber?: string;
  errorMessage?: string;
}

interface AddNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: string) => void;
}

export const AddNumberModal: React.FC<AddNumberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({ idle: true });

  const handleOneClick = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    try {
      setState({ loading: true });

      // Call Supabase Edge Function for one-click provisioning
      const response = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email || '',
          userLocation: user.user_metadata?.location || 'US'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Provisioning failed');
      }

      const { phoneNumber, twilioAccountSid, tenantId } = await response.json();

      setState({
        success: true,
        phoneNumber
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(phoneNumber);
      }

      // Show success toast
      toast.success(`AI Receptionist activated! Your number is ${phoneNumber}`, {
        description: 'Start receiving calls immediately. Forward your business line to this number.',
        duration: 6000
      });

      // Track analytics event
      if (window.gtag) {
        window.gtag('event', 'number_provisioned', {
          event_category: 'onboarding',
          event_label: 'one_click_provisioning',
          value: 1
        });
      }

    } catch (error: any) {
      console.error('Provisioning error:', error);
      const errorMessage = error.message || 'Failed to provision number. Please try again.';

      setState({
        error: true,
        errorMessage
      });

      toast.error('Provisioning Failed', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const resetState = () => {
    setState({ idle: true });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTryAgain = () => {
    resetState();
    handleOneClick();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Get Your AI Receptionist Number</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Idle State - Show One-Click Button */}
        {state.idle && (
          <div className="one-click-modal text-center">
            <div className="modal-header mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IonIcon icon={callOutline} className="text-2xl text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Activate AI Receptionist</h2>
              <p className="text-gray-600 text-sm">
                Get a local phone number and AI receptionist in 5 seconds
              </p>
            </div>

            <div className="space-y-4">
              <IonButton
                expand="block"
                size="large"
                onClick={handleOneClick}
                className="one-click-button bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg"
              >
                🚀 Activate AI Receptionist (One-Click)
              </IonButton>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 leading-relaxed">
                  We'll provision a local phone number, create your AI receptionist account,
                  and configure everything automatically. No forms, no waiting, no hassle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="loading-state text-center py-8">
            <IonSpinner name="crescent" className="text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Provisioning Your Number...</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Creating Twilio account</p>
              <p>Purchasing local phone number</p>
              <p>Configuring AI receptionist</p>
              <p>Setting up webhooks</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {state.success && (
          <div className="success-state text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={checkmarkCircleOutline} className="text-2xl text-green-600" />
            </div>

            <h2 className="text-xl font-semibold mb-2 text-green-700">
              ✅ Your AI Receptionist is Live!
            </h2>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Number:</p>
              <p className="text-2xl font-bold text-green-700 font-mono">
                {state.phoneNumber}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Start receiving calls immediately. Forward your business line to this number.
              </p>
            </div>

            <IonButton
              expand="block"
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              Go to Dashboard
            </IonButton>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="error-state text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={alertCircle} className="text-2xl text-red-600" />
            </div>

            <h2 className="text-xl font-semibold mb-2 text-red-700">
              ⚠️ Provisioning Failed
            </h2>

            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-red-800">
                {state.errorMessage}
              </p>
            </div>

            <div className="space-y-3">
              <IonButton
                expand="block"
                onClick={handleTryAgain}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                Try Again
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                onClick={handleClose}
              >
                Cancel
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};
