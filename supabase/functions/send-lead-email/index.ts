// Requires standard JWT auth via supabase-js when invoked from the app.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  const body = await req.json().catch(() => ({}))
  const { name, email, company } = body
  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'name and email required' }), { status: 400 })
  }
  // enqueue/send via your provider here; for now, accept
  return new Response(JSON.stringify({ accepted: true, company: company ?? null }), { status: 202 })
})
