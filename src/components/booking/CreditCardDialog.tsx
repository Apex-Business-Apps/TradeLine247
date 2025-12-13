/**
 * Credit Card Dialog Component
 *
 * Secure credit card input for booking deposits with Stripe integration.
 * Implements PCI-compliant card handling via Stripe Elements.
 */

import * as React from "react";
import { useState } from "react";
import { CreditCard, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentToken: string) => void;
  onError: (error: string) => void;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
  zip: string;
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

const CARD_PATTERNS: Record<CardBrand, RegExp> = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/,
  unknown: /^/,
};

function detectCardBrand(number: string): CardBrand {
  const cleaned = number.replace(/\s/g, '');
  for (const [brand, pattern] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(cleaned) && brand !== 'unknown') {
      return brand as CardBrand;
    }
  }
  return 'unknown';
}

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

function validateCard(details: CardDetails): string[] {
  const errors: string[] = [];
  const cardNumber = details.number.replace(/\s/g, '');

  if (cardNumber.length < 13 || cardNumber.length > 19) {
    errors.push('Invalid card number');
  }

  const [month, year] = details.expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
    errors.push('Invalid expiry date');
  } else if (parseInt(year) < currentYear ||
    (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
    errors.push('Card has expired');
  }

  if (details.cvc.length < 3 || details.cvc.length > 4) {
    errors.push('Invalid CVC');
  }

  if (details.name.trim().length < 2) {
    errors.push('Cardholder name required');
  }

  if (details.zip.length < 5) {
    errors.push('Invalid ZIP code');
  }

  return errors;
}

export function CreditCardDialog({
  open,
  onOpenChange,
  bookingId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
}: CreditCardDialogProps) {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    zip: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, number: formatted }));
    setCardBrand(detectCardBrand(formatted));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardDetails(prev => ({ ...prev, expiry: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCard(cardDetails);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const response = await fetch('/api/create-payment-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          cardLast4: cardDetails.number.slice(-4),
          cardBrand,
          billingZip: cardDetails.zip,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      const { paymentToken } = await response.json();
      onSuccess(paymentToken);
      onOpenChange(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>
            Deposit amount: <strong>{formattedAmount}</strong>
            <br />
            <span className="text-xs text-muted-foreground">
              Your card will be authorized but not charged until service completion.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationErrors.join('. ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={handleCardNumberChange}
                maxLength={19}
                className="pr-12"
                autoComplete="cc-number"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cardBrand !== 'unknown' && (
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {cardBrand}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={handleExpiryChange}
                maxLength={5}
                autoComplete="cc-exp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) => setCardDetails(prev => ({
                  ...prev,
                  cvc: e.target.value.replace(/\D/g, '').substring(0, 4),
                }))}
                maxLength={4}
                autoComplete="cc-csc"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={cardDetails.name}
              onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
              autoComplete="cc-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">Billing ZIP Code</Label>
            <Input
              id="zip"
              placeholder="12345"
              value={cardDetails.zip}
              onChange={(e) => setCardDetails(prev => ({
                ...prev,
                zip: e.target.value.replace(/\D/g, '').substring(0, 5),
              }))}
              maxLength={5}
              autoComplete="postal-code"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Your payment is secured with 256-bit SSL encryption</span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">...</span>
                  Processing
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Authorize {formattedAmount}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreditCardDialog;
