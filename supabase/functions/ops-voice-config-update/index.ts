// Authenticated update of org voice settings. Non-critical audit logging.
// Requires standard JWT auth via supabase-js when invoked from the app (token forwarded automatically).
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

serve(async (req) => {
  try {
    const auth = req.headers.get('authorization') ?? ''
    if (!auth?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { global: { headers: { Authorization: auth } } })

    const payload = await req.json().catch(() => ({}))
    // Accept minimal shape; extend to your schema
    const { org_id, config } = payload || {}
    if (!org_id || typeof config !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    // Upsert/update settings (adjust table/columns as needed)
    const { error } = await supabase.from('voice_settings').upsert({ org_id, config }, { onConflict: 'org_id' })
    if (error) throw error

    // Non-blocking audit (best effort)
    try {
      await supabase.from('audit_logs').insert({
        org_id,
        action: 'ops-voice-config-update',
        meta: { ok: true },
      })
    } catch (_) {}

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 })
  }
})
