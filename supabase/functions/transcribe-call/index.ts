import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface TranscribeRequest {
  call_sid: string;
  recording_url: string;
  tenant_id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  duration_seconds: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: TranscribeRequest = await req.json();

    console.log('Transcribing call:', body.call_sid);

    // Check if transcription already exists
    const { data: existing } = await supabase
      .from('call_transcriptions')
      .select('id')
      .eq('call_sid', body.call_sid)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Transcription already exists',
          transcription_id: existing.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let transcript = null;
    let confidence = null;

    // Transcribe using OpenAI Whisper if API key is configured
    if (OPENAI_API_KEY && body.recording_url) {
      try {
        // Download audio file
        const audioResponse = await fetch(body.recording_url);
        const audioBlob = await audioResponse.blob();

        // Create form data for Whisper API
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');

        const whisperResponse = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: formData
          }
        );

        if (whisperResponse.ok) {
          const whisperData = await whisperResponse.json();
          transcript = whisperData.text;
          
          // Calculate average confidence from segments
          if (whisperData.segments && whisperData.segments.length > 0) {
            const avgConfidence = whisperData.segments.reduce(
              (sum: number, seg: any) => sum + (seg.no_speech_prob || 0),
              0
            ) / whisperData.segments.length;
            confidence = 1 - avgConfidence; // Invert no_speech_prob
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
        // Continue without transcript
      }
    }

    // Store transcription record
    const { data: transcription, error: insertError } = await supabase
      .from('call_transcriptions')
      .insert({
        call_sid: body.call_sid,
        tenant_id: body.tenant_id,
        phone_number: body.phone_number,
        direction: body.direction,
        transcript_text: transcript,
        transcript_confidence: confidence,
        duration_seconds: body.duration_seconds,
        call_status: 'completed'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Store analytics metrics
    if (transcript) {
      const wordCount = transcript.split(/\s+/).length;
      const speakingRate = (wordCount / body.duration_seconds) * 60; // words per minute

      await supabase.from('call_analytics_metrics').insert([
        {
          call_sid: body.call_sid,
          metric_name: 'word_count',
          metric_value: wordCount
        },
        {
          call_sid: body.call_sid,
          metric_name: 'speaking_rate_wpm',
          metric_value: speakingRate
        }
      ]);
    }

    console.log('Transcription completed:', transcription.id);

    return new Response(
      JSON.stringify({
        success: true,
        transcription_id: transcription.id,
        has_transcript: !!transcript
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-call:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
