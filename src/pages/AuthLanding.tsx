import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { supabase, isSupabaseEnabled } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Validation schema
const trialSignupSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100, 'Business name too long'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email too long'),
});

type TrialSignupForm = z.infer<typeof trialSignupSchema>;

export default function AuthLanding() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof TrialSignupForm, string>>>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Client-side validation
    const result = trialSignupSchema.safeParse({ businessName, email });

    if (!result.success) {
      const errors: Partial<Record<keyof TrialSignupForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof TrialSignupForm;
        errors[path] = issue.message;
      });
      setValidationErrors(errors);
      return;
    }

    if (!isSupabaseEnabled) {
      setError('Authentication service is currently unavailable. Please try again later.');
      return;
    }

    setLoading(true);

    try {
      // Store trial signup information - properly typed from Database schema
      const leadData: Database['public']['Tables']['leads']['Insert'] = {
        name: businessName,
        email: email.toLowerCase(),
        company: businessName,
        notes: 'Trial signup from AuthLanding',
        source: 'trial_landing_page'
      };

      const { error: insertError } = await supabase
        .from('leads')
        .insert(leadData);

      if (insertError) {
        throw insertError;
      }

      // Redirect to full auth page to complete signup
      navigate(`${paths.auth}?email=${encodeURIComponent(email)}&trial=true`);

    } catch (err: any) {
      console.error('Trial signup error:', err);
      setError(err.message || 'Failed to start trial. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-4">Start Your Free 14-Day Trial</h1>
        <p className="mb-8 text-muted-foreground">
          No credit card required. Get full access to all features.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              type="text"
              placeholder="Your Company Inc."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              disabled={loading}
              className={validationErrors.businessName ? 'border-destructive' : ''}
            />
            {validationErrors.businessName && (
              <p className="text-sm text-destructive">{validationErrors.businessName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={validationErrors.email ? 'border-destructive' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="success"
            size="lg"
            className="w-full"
            disabled={loading || !businessName || !email}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start My 14-Day Trial
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate(paths.auth)}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}
