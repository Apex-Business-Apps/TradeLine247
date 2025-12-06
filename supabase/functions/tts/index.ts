/**
 * OpenAI TTS (Text-to-Speech) Function
 * 
 * Provides natural, low-latency text-to-speech using OpenAI's TTS API
 * Models: tts-1 (fast) or tts-1-hd (high quality)
 * Voices: alloy, echo, fable, onyx, nova, shimmer
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  model?: 'tts-1' | 'tts-1-hd';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: TTSRequest = await req.json();
    const { text, model = 'tts-1', voice = 'alloy', speed = 1.0 } = requestData;

    // Validation
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (text.length > 4096) {
      return new Response(JSON.stringify({ error: 'Text too long. Maximum 4096 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY not configured. Please add it to your environment variables.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating TTS:', { textLength: text.length, model, voice, speed });

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      
      let errorMessage = `OpenAI TTS API error: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OPENAI_API_KEY.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 402) {
        errorMessage = 'Payment required. Please check your OpenAI account billing.';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: errorText
      }), {
        status: response.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return audio as binary stream
    const audioBlob = await response.blob();
    
    return new Response(audioBlob, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('TTS function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

