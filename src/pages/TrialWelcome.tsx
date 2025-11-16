import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Phone, PhoneForwarded, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { AISEOHead } from "@/components/seo/AISEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, isSupabaseEnabled } from "@/integrations/supabase/client.ts";
import { ensureMembership } from "@/lib/ensureMembership";
import { errorReporter } from "@/lib/errorReporter";
import { getPlanDetails, PlanDetails } from "@/lib/trialPlans";
import { paths } from "@/routes/paths";

interface OrgState {
  id: string | null;
  name: string | null;
}

interface NumberState {
  phoneNumber: string | null;
  numberType: string | null;
}

const getStoredPlan = (): PlanDetails => {
  if (typeof window === "undefined") {
    return getPlanDetails("default");
  }
  const storedPlan = window.localStorage.getItem("tradeline:selectedPlan");
  return getPlanDetails(storedPlan ?? "default");
};

const TrialWelcome = () => {
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrgState>({ id: null, name: null });
  const [numberInfo, setNumberInfo] = useState<NumberState>({ phoneNumber: null, numberType: null });
  const [loading, setLoading] = useState(true);
  const [activateLoading, setActivateLoading] = useState(false);
  const [areaCode, setAreaCode] = useState("587");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const planDetails = useMemo(() => getStoredPlan(), []);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Unable to verify your session. Please sign in again.");
        setLoading(false);
        return;
      }

      const sessionUser = data.session?.user;
      if (!sessionUser) {
        navigate(paths.auth);
        return;
      }

      let organizationId: string | null = null;
      try {
        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", sessionUser.id)
          .maybeSingle();

        organizationId = membership?.org_id ?? null;

        if (!organizationId) {
          const result = await ensureMembership(sessionUser);
          organizationId = result.orgId;
        }
      } catch (membershipException) {
        errorReporter.report({
          type: "error",
          message: "Failed to fetch membership",
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          environment: errorReporter["getEnvironment"]?.(),
          metadata: {
            error: membershipException instanceof Error ? membershipException.message : String(membershipException),
          },
        });
      }

      if (!organizationId) {
        setError("We couldn’t create your trial organization automatically. Please contact support.");
        setLoading(false);
        return;
      }

      try {
        const [{ data: orgRow }, { data: numberRow }] = await Promise.all([
          supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
          supabase
            .from("tenant_phone_mappings")
            .select("phone_number, number_type")
            .eq("tenant_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        setOrg({ id: organizationId, name: orgRow?.name ?? planDetails.companyLabel });
        setNumberInfo({
          phoneNumber: numberRow?.phone_number ?? null,
          numberType: numberRow?.number_type ?? null,
        });
      } catch (loadError) {
        setError("We couldn’t load your onboarding status. Please refresh.");
        errorReporter.report({
          type: "error",
          message: "Failed to load trial welcome state",
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          environment: errorReporter["getEnvironment"]?.(),
          metadata: { error: loadError instanceof Error ? loadError.message : String(loadError) },
        });
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [navigate, planDetails.companyLabel]);

  const handleActivate = async () => {
    if (activateLoading || !org.id) {
      return;
    }

    if (numberInfo.phoneNumber) {
      setSuccess(`Your AI receptionist is already live at ${numberInfo.phoneNumber}.`);
      return;
    }

    setError(null);
    setSuccess(null);
    setActivateLoading(true);

    try {
      const sanitizedArea = areaCode.replace(/[^0-9]/g, "");
      const { data, error: functionError } = await supabase.functions.invoke("telephony-onboard", {
        body: {
          org_id: org.id,
          business_name: org.name ?? planDetails.companyLabel,
          area_code: sanitizedArea.length === 3 ? sanitizedArea : undefined,
          country: "CA",
        },
      });

      if (functionError) {
        throw new Error(functionError.message ?? "Activation failed");
      }

      const provisionedNumber = data?.phone_number as string | undefined;
      if (provisionedNumber) {
        setNumberInfo({ phoneNumber: provisionedNumber, numberType: data?.number_type ?? "ai" });
        setSuccess(`Your AI receptionist is live at ${provisionedNumber}.`);
      } else {
        setSuccess("Telephony activated. Refresh to see your TradeLine number.");
      }
    } catch (activationError) {
      const message =
        activationError instanceof Error ? activationError.message : "We couldn’t activate your AI receptionist.";
      setError(message);
      errorReporter.report({
        type: "error",
        message: "telephony-onboard failed",
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        environment: errorReporter["getEnvironment"]?.(),
        metadata: { message, orgId: org.id },
      });
    } finally {
      setActivateLoading(false);
    }
  };

  const formattedNumber = numberInfo.phoneNumber
    ? `(${numberInfo.phoneNumber.slice(-10, -7)}) ${numberInfo.phoneNumber.slice(-7, -4)}-${numberInfo.phoneNumber.slice(-4)}`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AISEOHead
        title="You’re Live – TradeLine 24/7 Trial"
        description="Your AI receptionist is ready. Provision your TradeLine number, forward calls, and start capturing jobs in minutes."
        canonical="https://tradeline247ai.com/welcome"
        directAnswer="Turn on your AI receptionist by provisioning your TradeLine number and forwarding calls in one click."
        keyFacts={[
          { label: "Plan", value: planDetails.label },
          { label: "Status", value: numberInfo.phoneNumber ? "Live" : "Action needed" },
          { label: "Forwarding", value: "Carrier call forwarding supported" },
          { label: "Languages", value: "55+" },
        ]}
        faqs={[
          {
            question: "How do I test my AI receptionist?",
            answer:
              "Click the call button below to dial your TradeLine number. You can also send yourself a voicemail summary once the number is live.",
          },
          {
            question: "Can I change area codes later?",
            answer: "Yes. Provisioning is idempotent — request a new number anytime without duplicating charges.",
          },
        ]}
        ogMeta={{
          title: "Your AI Receptionist Is Live | TradeLine 24/7",
          description: "Forward calls and test your AI receptionist instantly. Hosted in Canada with compliance baked in.",
          image: "/og/tradeline-fast-trust.jpg",
          url: "https://tradeline247ai.com/welcome",
        }}
        twitterMeta={{
          title: "TradeLine Trial Activated",
          description: "Provision your number and start capturing calls in minutes.",
          image: "/og/tradeline-fast-trust.jpg",
        }}
      />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-10">
          <header className="space-y-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-info/10 px-3 py-1 text-sm font-medium text-info">
              <ShieldCheck className="h-4 w-4" /> Trial: {planDetails.label}
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              You’re live. Your AI receptionist is on duty 24/7.
            </h1>
            <p className="text-lg text-muted-foreground">
              We’ve set up your TradeLine workspace. Activate your number, forward your existing line, and start booking jobs
              immediately.
            </p>
          </header>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card className="border border-border/70 bg-card/90 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Activate your TradeLine number</CardTitle>
              <CardDescription>
                Provisioning is one-click and idempotent. We’ll reuse the same number if you press the button again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="area-code">
                      Preferred area code (optional)
                    </label>
                    <Input
                      id="area-code"
                      inputMode="numeric"
                      maxLength={3}
                      value={areaCode}
                      onChange={(event) => setAreaCode(event.target.value)}
                      placeholder="587"
                      aria-describedby="area-code-help"
                      disabled={activateLoading || loading}
                    />
                    <p id="area-code-help" className="text-xs text-muted-foreground">
                      Leave blank for best available Canadian number.
                    </p>
                  </div>

                  <Button
                    id="activate-receptionist"
                    size="lg"
                    className="w-full"
                    onClick={handleActivate}
                    disabled={activateLoading || loading || !org.id}
                  >
                    {activateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Turn On My AI Receptionist
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Provisioning takes less than 30 seconds. We’ll configure voice + SMS webhooks automatically.
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/40 p-6">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Your TradeLine number</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground" aria-live="polite">
                    {formattedNumber ?? "Pending activation"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" variant="outline" disabled={!numberInfo.phoneNumber} asChild>
                      <a href={numberInfo.phoneNumber ? `tel:${numberInfo.phoneNumber}` : undefined}>
                        <PhoneForwarded className="mr-2 h-4 w-4" /> Call your AI receptionist
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this number handy. You’ll forward your existing business line here to capture every call.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle>Forwarding checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                    <span>Open your carrier’s call forwarding settings (mobile app or star codes).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                    <span>Forward your business line to your TradeLine number {formattedNumber ? `(${formattedNumber})` : "once provisioned"}.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                    <span>Place a test call after forwarding and listen for your AI receptionist greeting.</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle>Next steps (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Make it your own — these can wait until after you’re live.</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <a className="font-medium text-primary underline-offset-4 hover:underline" href={paths.voiceSettings}>
                      Customize greeting & business hours
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <a className="font-medium text-primary underline-offset-4 hover:underline" href={paths.integrations}>
                      Connect CRM or dispatch tools
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <a className="font-medium text-primary underline-offset-4 hover:underline" href={paths.forwardingWizard}>
                      Download carrier forwarding kits
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your onboarding status…
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrialWelcome;
