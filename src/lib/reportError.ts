// Lightweight client error bridge to Supabase Edge error intake.
// Swallows failures so that UI UX is unaffected.
export async function reportError(err: unknown, orgId?: string) {
  try {
    const base = import.meta.env.VITE_FUNCTIONS_BASE;
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
  } catch (_) {
    // no-op: logging bridge must not throw
  }
}
