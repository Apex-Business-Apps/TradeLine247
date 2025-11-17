// Lightweight client error bridge to Supabase Edge error intake.
// Swallows failures so that UI UX is unaffected.
export async function reportError(err: unknown, orgId?: string) {
  try {
    // CRITICAL: Hardcoded fallback for production (VITE_* env vars not supported in Lovable)
    const base = import.meta.env.VITE_FUNCTIONS_BASE || 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1';
    if (!base) return;

    let serialized: Record<string, unknown> = {};
    try {
      if (err && typeof err === "object") {
        serialized = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } else {
        serialized = { message: String(err) };
      }
    } catch (_) {
      serialized = { message: err instanceof Error ? err.message : String(err) };
    }

    const payload = {
      org_id: orgId ?? null,
      error_id: crypto.randomUUID(),
      error_type: (err as any)?.type ?? (err instanceof Error ? err.name : "unknown"),
      payload: serialized,
      user_agent: navigator.userAgent,
    };

    await fetch(`${base}/ops-error-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (reportingError) {
    // Fallback: Store error in localStorage for debugging
    try {
      const fallbackKey = 'error_reporting_failures';
      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');

      // Helper to extract message from various error types
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (error && typeof error === 'object' && 'message' in error) {
          return String(error.message);
        }
        return String(error);
      };

      existing.push({
        originalError: getErrorMessage(err),
        reportingError: getErrorMessage(reportingError),
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent || 'unknown'
      });
      // Keep only last 10 failures to prevent localStorage bloat
      const limited = existing.slice(-10);
      localStorage.setItem(fallbackKey, JSON.stringify(limited));
    } catch (storageError) {
      // Final fallback - console only (better than complete silence)
      console.error('[reportError] Failed to report error and store fallback:', {
        originalError: err,
        reportingError,
        storageError
      });
    }
  }
}
