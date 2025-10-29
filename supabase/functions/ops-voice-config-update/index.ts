import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '*'
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    }})
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: {
        Authorization: req.headers.get('Authorization') ?? '',
      } } }
  )
  // If privileged writes are required for a table, create a second client with service role:
  // const admin = createClient(Deno.env.get('SUPABASE_URL')??'', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'')

  const body = await req.json().catch(() => ({}))
  // TODO: validate body minimally; upsert config scoped by auth.uid()
  // Example:
  // const { data: user } = await supabase.auth.getUser()
  // if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin }})
  // const { error } = await supabase.from('voice_settings').upsert({ user_id: user.user.id, ...body }).select().single()

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin }
  })
})
