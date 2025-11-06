import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { errorReporter } from "@/lib/errorReporter";

export interface MembershipResult {
  orgId: string | null;
  error?: string;
}

/**
 * Ensure the given user has an organization membership and an active trial.
 * Idempotent: safe to call repeatedly. Returns orgId when available/created.
 */
export async function ensureMembership(user: User): Promise<MembershipResult> {
  try {
    // 1) Check existing membership (client-side RLS allows self view)
    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memErr) {
      // Non-fatal: proceed to function for idempotent ensure
      errorReporter.report({
        type: 'error',
        message: `ensureMembership: membership check warning: ${memErr.message}`,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        environment: errorReporter['getEnvironment'](),
        metadata: { userId: user.id }
      });
    }

    if (membership?.org_id) {
      return { orgId: membership.org_id as string };
    }

    // 2) Call edge function to create org + 14-day trial (idempotent server-side)
    const company = (user.user_metadata?.display_name as string | undefined) || undefined;
    const { data, error } = await supabase.functions.invoke("start-trial", {
      body: { company },
    });

    if (error) {
      errorReporter.report({
        type: 'error',
        message: `ensureMembership: start-trial error: ${error.message}`,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        environment: errorReporter['getEnvironment'](),
        metadata: { userId: user.id }
      });
      return { orgId: null, error: error.message || "Couldn't create trial" };
    }

    if (!data?.ok) {
      const msg = data?.error || "Couldn't create trial";
      errorReporter.report({
        type: 'error',
        message: `ensureMembership: start-trial failed: ${msg}`,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        environment: errorReporter['getEnvironment'](),
        metadata: { userId: user.id }
      });
      return { orgId: null, error: msg };
    }

    return { orgId: (data?.orgId as string) ?? null };
  } catch (e: any) {
    errorReporter.report({
      type: 'error',
      message: `ensureMembership: unexpected error: ${e?.message}`,
      stack: e?.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      environment: errorReporter['getEnvironment'](),
      metadata: { userId: user.id }
    });
    return { orgId: null, error: e?.message || "Unexpected error during trial setup" };
  }
}

