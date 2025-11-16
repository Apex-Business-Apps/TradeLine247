import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, isSupabaseEnabled } from "@/integrations/supabase/client.ts";
import type { Database } from "@/integrations/supabase/types";
import { AISEOHead } from "@/components/seo/AISEOHead";
import { paths } from "@/routes/paths";
import { errorReporter } from "@/lib/errorReporter";
import { getPlanDetails, PlanId } from "@/lib/trialPlans";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your work email")
  .email("Enter a valid email address");

const persistSelection = (plan: PlanId, email: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("tradeline:selectedPlan", plan);
    if (email) {
      window.localStorage.setItem("tradeline:trialEmail", email);
    }
  } catch (error) {
    console.warn("Failed to persist plan selection", error);
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = (searchParams.get("plan")?.toLowerCase() as PlanId | null) ?? "default";
  const planInfo = useMemo(() => getPlanDetails(requestedPlan), [requestedPlan]);

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    persistSelection(planInfo.id, email);
  }, [planInfo.id, email]);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        persistSelection(planInfo.id, email);
        navigate(paths.welcome, { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        navigate(paths.welcome, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, planInfo.id, email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }

    if (!isSupabaseEnabled) {
      setError("Authentication service is unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);

    const normalizedEmail = parsedEmail.data.toLowerCase();
    const leadPayload: Database["public"]["Tables"]["leads"]["Insert"] = {
      name: normalizedEmail,
      email: normalizedEmail,
      company: planInfo.companyLabel,
      notes: `${planInfo.leadSource}:fast-trust`,
      source: planInfo.leadSource,
    };

    try {
      const { error: leadError } = await supabase.from("leads").insert(leadPayload);
      if (leadError && !leadError.message?.toLowerCase().includes("duplicate")) {
        errorReporter.report({
          type: "error",
          message: `Lead capture failed: ${leadError.message}`,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          environment: errorReporter["getEnvironment"]?.(),
          metadata: { plan: planInfo.id },
        });
      }
    } catch (leadException) {
      errorReporter.report({
        type: "error",
        message: "Lead capture threw",
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        environment: errorReporter["getEnvironment"]?.(),
        metadata: { error: leadException instanceof Error ? leadException.message : String(leadException) },
      });
    }

    try {
      const redirectUrl = `${window.location.origin}${paths.welcome}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            trial_plan: planInfo.id,
            lead_source: planInfo.leadSource,
          },
        },
      });

      if (otpError) {
        throw otpError;
      }

      persistSelection(planInfo.id, normalizedEmail);
      setMessage("Magic link sent! Check your email to activate your AI receptionist.");
    } catch (authError: unknown) {
      const friendlyMessage =
        authError instanceof Error ? authError.message : "Unable to send magic link. Please try again.";
      setError(friendlyMessage);
      errorReporter.report({
        type: "error",
        message: `Magic link request failed: ${friendlyMessage}`,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        environment: errorReporter["getEnvironment"]?.(),
        metadata: { plan: planInfo.id },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AISEOHead
        title="Start Your Free TradeLine 24/7 Trial"
        description="Activate your AI receptionist in one click. Hosted in Canada, compliant with PIPEDA/PIPA, and ready for trades, clinics, and solo operators."
        canonical="https://tradeline247ai.com/auth"
        contentType="service"
        directAnswer="Enter your work email and we will send a secure magic link to activate your TradeLine 24/7 trial."
        keyFacts={[
          { label: "Trial length", value: "7 days" },
          { label: "Setup", value: "One click" },
          { label: "Coverage", value: "24/7 · 55+ languages" },
          { label: "Hosting", value: "Canada" },
        ]}
        faqs={[
          {
            question: "Do I need a credit card to start?",
            answer: "No. We only ask for your work email to send a secure magic link. Choose a plan once you see the value.",
          },
          {
            question: "Is TradeLine 24/7 a credit tradeline service?",
            answer: "No. We are an AI receptionist for service businesses — plumbers, HVAC, clinics, and operators who cannot miss calls.",
          },
          {
            question: "What happens after the trial?",
            answer: "Keep the plan you selected or switch. We’ll confirm payment details once you’re ready to stay live.",
          },
        ]}
        ogMeta={{
          title: "Start Your Free 7-Day Trial | TradeLine 24/7",
          description: "One-click activation for your AI receptionist. Hosted in Canada with compliance baked in.",
          image: "/og/tradeline-fast-trust.jpg",
          url: "https://tradeline247ai.com/auth",
        }}
        twitterMeta={{
          title: "TradeLine 24/7 Free Trial",
          description: "Start your AI receptionist trial in one click. No passwords, no credit card.",
          image: "/og/tradeline-fast-trust.jpg",
        }}
      />

      <main className="container mx-auto flex flex-col gap-12 px-4 py-16 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
            <ShieldCheck className="h-4 w-4" /> Hosted in Canada · PIPEDA/PIPA-ready
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Start your free 7-day trial — your AI receptionist is ready
          </h1>
          <p className="text-lg text-muted-foreground">
            We answer, qualify, and book calls while you’re on the job or off the clock. Enter your work email, receive a secure
            magic link, and you’re live in minutes.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> One-click onboarding
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                We provision your TradeLine number immediately. Forward calls or test instantly.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4 text-info" /> Magic link security
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                No passwords to remember. We send a secure link that expires quickly for safety.
              </p>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <Card className="border border-border/70 bg-card/90 shadow-xl backdrop-blur">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-foreground">{planInfo.label}</CardTitle>
                {planInfo.badge && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {planInfo.badge}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{planInfo.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {planInfo.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <Sparkles className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="trial-email">Work email</Label>
                  <Input
                    id="trial-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    aria-describedby="email-help"
                    disabled={loading}
                  />
                  <p id="email-help" className="text-xs text-muted-foreground">
                    We’ll send a secure magic link to activate your AI receptionist.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading} id="start-trial-auth">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Send magic link
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">{planInfo.notes}</p>
              <div className="text-xs text-muted-foreground">
                Need to switch plans? <a className="font-medium text-primary underline-offset-4 hover:underline" href={paths.pricing}>See all pricing options</a>.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Auth;
