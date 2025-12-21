import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent calls with status timeline (last 50 calls)
    const { data: calls, error: callsError } = await supabase
      .from('call_logs')
      .select(`
        call_sid,
        from_number,
        to_number,
        status,
        started_at,
        ended_at,
        transcript,
        recording_url,
        recording_status,
        call_category,
        consent_recording,
        consent_sms_opt_in,
        needs_review,
        handoff,
        handoff_reason,
        call_lifecycle (
          status,
          updated_at,
          meta
        )
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch calls' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format response with status timeline for each call
    const formattedCalls = calls?.map(call => {
      const lifecycle = call.call_lifecycle || [];
      const statusTimeline = lifecycle
        .sort((a: any, b: any) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
        .map((event: any) => ({
          status: event.status,
          timestamp: event.updated_at,
          meta: event.meta
        }));

      return {
        call_sid: call.call_sid,
        from_number: call.from_number,
        to_number: call.to_number,
        current_status: call.status,
        started_at: call.started_at,
        ended_at: call.ended_at,
        duration_seconds: call.ended_at && call.started_at
          ? Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
          : null,
        has_transcript: !!call.transcript,
        has_recording: !!call.recording_url,
        recording_status: call.recording_status,
        call_category: call.call_category,
        consent_recording: call.consent_recording,
        consent_sms_opt_in: call.consent_sms_opt_in,
        needs_review: call.needs_review,
        handoff: call.handoff,
        handoff_reason: call.handoff_reason,
        status_timeline: statusTimeline,
        transcript_length: call.transcript?.length || 0
      };
    }) || [];

    // Get summary statistics
    const summary = {
      total_calls: formattedCalls.length,
      calls_with_transcripts: formattedCalls.filter(c => c.has_transcript).length,
      calls_with_recordings: formattedCalls.filter(c => c.has_recording).length,
      calls_needing_review: formattedCalls.filter(c => c.needs_review).length,
      calls_with_handoff: formattedCalls.filter(c => c.handoff).length,
      status_distribution: formattedCalls.reduce((acc: Record<string, number>, call) => {
        acc[call.current_status || 'unknown'] = (acc[call.current_status || 'unknown'] || 0) + 1;
        return acc;
      }, {})
    };

    return new Response(JSON.stringify({
      summary,
      calls: formattedCalls,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in QA view:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});