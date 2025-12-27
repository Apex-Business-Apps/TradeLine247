import React from 'react';
import { IonButton, IonIcon, IonCard, IonCardContent } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';

interface OnboardingSuccessProps {
  phoneNumber: string;
  onContinue?: () => void;
  className?: string;
}

export const OnboardingSuccess: React.FC<OnboardingSuccessProps> = ({
  phoneNumber,
  onContinue,
  className = ''
}) => {
  return (
    <IonCard className={`success-card ${className}`}>
      <IonCardContent className="text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IonIcon icon={checkmarkCircleOutline} className="text-2xl text-green-600" />
        </div>

        <h2 className="text-xl font-semibold mb-2 text-green-700">
          Your AI Receptionist is Live!
        </h2>

        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-2">Your Number:</p>
          <p className="text-2xl font-bold text-green-700 font-mono">
            {phoneNumber}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            Start receiving calls immediately. Forward your business line to this number.
          </p>
        </div>

        {onContinue && (
          <IonButton
            expand="block"
            onClick={onContinue}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Continue to Dashboard
          </IonButton>
        )}
      </IonCardContent>
    </IonCard>
  );
};
