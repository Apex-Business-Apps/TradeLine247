import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import SafeErrorBoundary from "@/components/errors/SafeErrorBoundary";
import { PreviewDiagnostics } from "@/components/dev/PreviewDiagnostics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";

const isTestErrorFlagEnabled =
  import.meta.env.VITE_ENABLE_TEST_ERROR === "true" ||
  import.meta.env.NEXT_PUBLIC_ENABLE_TEST_ERROR === "true" ||
  import.meta.env.MODE !== "production";

function PreviewHealthContent() {
  const [searchParams] = useSearchParams();

  const shouldTriggerTestError = useMemo(() => {
    const wantsTrigger = searchParams.get("testErrorBoundary") === "1";
    return isTestErrorFlagEnabled && wantsTrigger;
  }, [searchParams]);

  if (shouldTriggerTestError) {
    // CONTRACT: E2E error boundary tests rely on ?testErrorBoundary=1 causing an error
    // inside this component when the preview/test flag is enabled. Keep synchronized with tests.
    throw new Error("Preview health test trigger");
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-16">
      <div className="container max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Preview Environment
          </p>
          <h1 className="text-4xl font-bold">Health Checklist</h1>
          <p className="text-muted-foreground">
            Use this page to verify that the preview build is stable before handing it
            off for stakeholder review or QA.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Automated diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The widget below runs the same checks exercised by our Preview Environment
              Health tests, including safe mode detection, error boundary coverage, and
              service worker status.
            </p>
            <PreviewDiagnostics />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function PreviewHealth() {
  return (
    <>
      <SEOHead
        title="Preview Health – TradeLine 24/7"
        description="Diagnostics page for verifying preview builds, safe mode, and error boundaries."
        canonical="https://www.tradeline247ai.com/preview-health"
        noIndex
      />
      <SafeErrorBoundary>
        <PreviewHealthContent />
      </SafeErrorBoundary>
    </>
  );
}



