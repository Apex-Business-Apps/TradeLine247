import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { preflight, jsonResponse, unexpectedErrorResponse } from "../_shared/cors.ts";

/**
 * Server-side admin verification endpoint
 * Returns 200 only if user is authenticated and has admin role
 */
serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return jsonResponse({ ok: false }, { status: 401 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return jsonResponse({ ok: false }, { status: 401 });
    }

    // Check admin role
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roles) {
      return jsonResponse({ ok: false }, { status: 403 });
    }

    // Success - user is admin
    return jsonResponse({ ok: true });

  } catch (error: any) {
    return unexpectedErrorResponse(error, 'admin-check');
  }
});

