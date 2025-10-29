// Requires standard JWT auth via supabase-js when invoked from the app.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
serve(async (req) => {
  const { ANALYTICS_WRITE_KEY } = Deno.env.toObject()
  if (!ANALYTICS_WRITE_KEY) return new Response(null, { status: 204 }) // gated no-op
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  // accept and drop (or forward to your sink)
  return new Response(null, { status: 202 })
})
