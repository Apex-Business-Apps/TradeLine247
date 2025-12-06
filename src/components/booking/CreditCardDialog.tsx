import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Shield, Lock, CheckCircle } from 'lucide-react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingData: {
    callerName: string;
    callerEmail: string;
    callerPhone: string;
    serviceType: string;
    serviceDescription?: string;
    preferredDate?: Date;
    preferredTime?: string;
    durationMinutes?: number;
  };
  onBookingComplete: (bookingRef: string) => void;
}

interface BookingResponse {
  bookingId: string;
  bookingReference: string;
  clientSecret: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function CreditCardDialog({
  open,
  onOpenChange,
  bookingData,
  onBookingComplete
}: CreditCardDialogProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'payment' | 'confirming'>('details');

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (paymentMethodId: string): Promise<BookingResponse> => {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          ...bookingData,
          paymentMethodId,
        },
      });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('confirming');

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: bookingData.callerName,
          email: bookingData.callerEmail,
          phone: bookingData.callerPhone,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create booking with payment method
      const bookingResponse = await createBookingMutation.mutateAsync(paymentMethod!.id);

      // Confirm payment (but don't capture - just authorize for commitment)
      const { error: confirmError } = await stripe.confirmCardPayment(bookingResponse.clientSecret, {
        payment_method: paymentMethod!.id,
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Success!
      toast.success('Booking confirmed! Check your email for details.');
      onBookingComplete(bookingResponse.bookingReference);
      onOpenChange(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetailsSubmit = () => {
    setStep('payment');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Secure Booking Commitment
          </DialogTitle>
          <DialogDescription>
            Complete your booking with a secure credit card commitment. No charges will be made until your appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'details' ? 'text-primary' : step === 'payment' || step === 'confirming' ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-primary' : step === 'confirming' ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Payment</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'confirming' ? 'text-primary' : 'text-muted-foreground'}`}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>

          {/* Booking Details Step */}
          {step === 'details' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={bookingData.callerName}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bookingData.callerEmail || ''}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={bookingData.callerPhone}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service">Service Type</Label>
                    <Input
                      id="service"
                      value={bookingData.serviceType}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  {bookingData.serviceDescription && (
                    <div>
                      <Label htmlFor="description">Service Description</Label>
                      <Input
                        id="description"
                        value={bookingData.serviceDescription}
                        disabled
                        className="mt-1"
                      />
                    </div>
                  )}

                  {(bookingData.preferredDate || bookingData.preferredTime) && (
                    <div>
                      <Label>Preferred Schedule</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {bookingData.preferredDate && bookingData.preferredTime
                          ? `${bookingData.preferredDate.toLocaleDateString()} at ${bookingData.preferredTime}`
                          : bookingData.preferredDate
                            ? bookingData.preferredDate.toLocaleDateString()
                            : bookingData.preferredTime || 'To be scheduled'
                        }
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleDetailsSubmit}
                  className="w-full mt-6"
                >
                  Continue to Secure Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Your payment information is encrypted and secure</span>
                    </div>

                    <div>
                      <Label htmlFor="card-element">Credit Card Information</Label>
                      <div className="mt-2 p-3 border rounded-md bg-muted/50">
                        <CardElement
                          id="card-element"
                          options={CARD_ELEMENT_OPTIONS}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>
                        Your card will be authorized but not charged. Funds are held securely until your appointment.
                      </span>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('details')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={!stripe || isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Booking'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {/* Confirming Step */}
          {step === 'confirming' && (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <div>
                    <h3 className="text-lg font-medium">Confirming your booking...</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We're securely processing your payment authorization and scheduling your appointment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}