import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { performSafetyCheck, sanitizeForLogging, type SafetyConfig } from "../_shared/voiceSafety.ts";

// Helper: Substitute variables in prompt template
function substitutePromptTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// Helper: Get optimized prompt with caching structure and few-shot examples
function getOptimizedVoicePrompt(businessName: string, humanNumber: string): string {
  return `[STATIC INSTRUCTIONS - Cacheable]
You are the AI receptionist for ${businessName}. You speak Canadian English with a warm, professional tone.

CORE PRINCIPLES:
1. Brevity: Keep responses under 15 seconds
2. Accuracy: Never invent data - if unsure, ask
3. Confirmation: Always read back captured information
4. Human Handoff: Offer immediately if requested or situation is urgent

REQUIRED FIELDS TO CAPTURE:
- caller_name: Full name of caller
- callback_number: Phone number (read digit-by-digit for confirmation)
- email: Email address (spell back for confirmation)
- job_summary: Brief description of their needs (max 50 words)
- preferred_datetime: When they want service

[EXAMPLES - Few-Shot Learning]

Example 1: New Caller
Caller: "Hi, I need some electrical work done."
Assistant: "Welcome to ${businessName}! I'd be happy to help. May I start with your name?"
Caller: "It's Sarah Chen."
Assistant: "Thank you, Sarah. What's the best number to reach you?"
Caller: "416-555-0123."
Assistant: "Great, 4-1-6, 5-5-5, 0-1-2-3. And your email?"
Caller: "sarah.chen@email.com"
Assistant: "Perfect, S-A-R-A-H dot C-H-E-N at email dot com. Can you briefly describe the electrical work you need?"
Caller: "Some outlets in my kitchen aren't working."
Assistant: "Got it. When would you like us to come by?"
Caller: "This Thursday afternoon?"
Assistant: "Thursday afternoon works. I've captured all your details. Let me connect you to our scheduling team right now."

Example 2: Urgent Request
Caller: "I need to speak to someone right away! My furnace died!"
Assistant: "I understand this is urgent. Let me connect you to ${humanNumber} immediately. Please hold."

Example 3: Handling Background Noise
Caller: [muffled] "Can you hear me?"
Assistant: "I'm having trouble hearing you clearly. Could you repeat that in a quieter area?"

[DYNAMIC CONTEXT - Changes Per Call]
Current conversation will unfold below:
`;
}

// Helper: Get enhanced preset with safety config
async function getEnhancedPreset(supabase: any, presetId: string | null, config: any) {
  const businessName = config?.business_name || 'Apex Business Systems';
  const humanNumber = config?.human_number_e164 || '+14319900222';
  
  if (!presetId) {
    return {
      system_prompt: getOptimizedVoicePrompt(businessName, humanNumber),
      max_reply_seconds: config?.llm_max_reply_seconds || 15,
      speaking_rate: config?.llm_speaking_rate || 1.0,
      voice: config?.llm_voice || 'alloy',
      safety_guardrails: {
        content_filter: true,
        profanity_block: true,
        sentiment_tracking: true,
        escalation_triggers: ['lawsuit', 'legal action', 'regulatory', 'security']
      } as SafetyConfig
    };
  }

  const { data: preset } = await supabase
    .from('voice_presets')
    .select('*')
    .eq('id', presetId)
    .single();

  if (!preset) {
    return null;
  }

  // Substitute template variables in optimized prompt
  return {
    system_prompt: getOptimizedVoicePrompt(businessName, humanNumber),
    max_reply_seconds: preset.max_reply_seconds || 15,
    speaking_rate: preset.speaking_rate || 1.0,
    voice: preset.voice || 'alloy',
    safety_guardrails: (preset.safety_guardrails || {
      content_filter: true,
      profanity_block: true,
      sentiment_tracking: true,
      escalation_triggers: []
    }) as SafetyConfig
  };
}

Deno.serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected websocket connection", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const url = new URL(req.url);
  const callSid = url.searchParams.get('callSid');
  
  if (!callSid) {
    socket.close(1008, 'Missing callSid');
    return response;
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  if (!OPENAI_API_KEY) {
    socket.close(1011, 'OpenAI API key not configured');
    return response;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get voice config and enhanced preset
  const { data: config } = await supabase
    .from('voice_config')
    .select('*')
    .single();

  const preset = await getEnhancedPreset(supabase, config?.active_preset_id || null, config);
  
  if (!preset) {
    socket.close(1011, 'Invalid preset configuration');
    return response;
  }

  const systemPrompt = preset.system_prompt;

  let openaiWs: WebSocket;
  let streamSid: string | null = null;
  let lastActivityTime = Date.now();
  let silenceCheckInterval: number;
  let transcript = '';
  let capturedFields: any = {};
  let conversationStartTime = Date.now();
  let turnCount = 0;
  let sentimentHistory: number[] = [];
  let userTranscript = ''; // Track user speech separately for safety checks
  const safetyConfig = preset.safety_guardrails;

  // Connect to OpenAI Realtime API
  try {
    openaiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      }
    );

    openaiWs.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
      
      // Configure session
      openaiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: systemPrompt,
          voice: preset.voice,
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8,
          max_response_output_tokens: 'inf'
        }
      }));
    };

    openaiWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      lastActivityTime = Date.now();

      // Handle different event types
      if (data.type === 'response.audio.delta' && streamSid) {
        // Forward audio to Twilio
        socket.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: data.delta
          }
        }));
      } else if (data.type === 'response.audio_transcript.delta') {
        transcript += data.delta;
      } else if (data.type === 'conversation.item.input_audio_buffer.committed') {
        // User speech committed - perform safety check (enhanced feature)
        if (data.item?.transcript && safetyConfig) {
          const userText = data.item.transcript;
          userTranscript += userText + ' ';
          
          // Perform safety check on user input (non-blocking - logs only)
          try {
            const safetyResult = performSafetyCheck(
              userText,
              safetyConfig,
              {
                duration_seconds: Math.floor((Date.now() - conversationStartTime) / 1000),
                turn_count: turnCount,
                sentiment_history: sentimentHistory
              }
            );

            if (safetyResult.sentiment_score !== undefined) {
              sentimentHistory.push(safetyResult.sentiment_score);
              // Keep only last 10 sentiment scores
              if (sentimentHistory.length > 10) {
                sentimentHistory = sentimentHistory.slice(-10);
              }
            }

            // Handle safety actions (non-blocking for backward compatibility)
            if (!safetyResult.safe && safetyResult.action === 'escalate') {
              console.log(`⚠️ Safety escalation triggered: ${safetyResult.reason}`);
              
              // Log safety event (non-blocking)
              supabase.from('voice_safety_logs').insert({
                call_sid: callSid,
                event_type: 'safety_escalation',
                reason: safetyResult.reason,
                confidence: safetyResult.confidence || 0.8,
                sanitized_text: sanitizeForLogging(userText),
                sentiment_score: safetyResult.sentiment_score
              }).then(({ error }) => {
                if (error) console.error('Safety log error:', error);
              });
              
              // Flag for escalation
              supabase.from('call_logs')
                .update({ 
                  captured_fields: { 
                    ...capturedFields,
                    safety_flag: true,
                    safety_escalation_reason: safetyResult.reason,
                    safety_confidence: safetyResult.confidence || 0.8,
                    sentiment_score: safetyResult.sentiment_score
                  }
                })
                .eq('call_sid', callSid)
                .then(({ error }) => {
                  if (error) console.error('Safety flag error:', error);
                });
            }
          } catch (error) {
            // Safety checks should never break the conversation flow
            console.error('Safety check error (non-fatal):', error);
          }
        }
      } else if (data.type === 'response.done') {
        turnCount++;
        // Extract captured fields from response
        if (data.response?.output) {
          try {
            capturedFields = JSON.parse(data.response.output);
          } catch {}
        }
      } else if (data.type === 'error') {
        console.error('OpenAI error:', data.error);
        
        // Fail open: bridge to human
        if (config?.fail_open !== false) {
          socket.send(JSON.stringify({
            event: 'clear',
            streamSid: streamSid
          }));
          
          supabase.from('call_logs')
            .update({ 
              handoff: true, 
              handoff_reason: 'llm_error',
              fail_path: 'fail_open_bridge'
            })
            .eq('call_sid', callSid)
            .then();
        }
      }
    };

    openaiWs.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
    };

    openaiWs.onclose = () => {
      console.log('OpenAI WebSocket closed');
      clearInterval(silenceCheckInterval);
    };

  } catch (error) {
    console.error('Failed to connect to OpenAI:', error);
    socket.close(1011, 'OpenAI connection failed');
    return response;
  }

  // Watchdog - 3s handshake timeout, log evidence (no PII)
  const handshakeStartTime = Date.now();
  let handshakeCompleted = false;
  
  const handshakeWatchdog = setTimeout(async () => {
    if (!handshakeCompleted) {
      const elapsedMs = Date.now() - handshakeStartTime;
      console.log(`⚠️ Handshake timeout (${elapsedMs}ms) - CallSid will failover to human bridge`);
      
      // Record evidence row (unique on call_sid) - NO PII
      await supabase.from('voice_stream_logs').upsert({
        call_sid: callSid,
        started_at: new Date(handshakeStartTime).toISOString(),
        connected_at: null,
        elapsed_ms: elapsedMs,
        fell_back: true,
        error_message: 'Handshake timeout (>3000ms)'
      }, { onConflict: 'call_sid' });
      
      // Tag call with stream_fallback=true - NO PII
      await supabase.from('call_logs')
        .update({ 
          handoff: true, 
          handoff_reason: 'handshake_timeout',
          fail_path: 'watchdog_bridge',
          captured_fields: { stream_fallback: true, handshake_ms: elapsedMs }
        })
        .eq('call_sid', callSid);
      
      openaiWs.close();
      socket.close();
    }
  }, 3000);

  // Silence detection (6s threshold)
  silenceCheckInterval = setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    if (timeSinceActivity > 6000 && openaiWs.readyState === WebSocket.OPEN) {
      console.log('⚠️ Silence detected (>6s), sending nudge');
      
      openaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: 'Are you still there?'
          }]
        }
      }));
      
      openaiWs.send(JSON.stringify({ type: 'response.create' }));
      
      // If no response after nudge, bridge to human
      setTimeout(() => {
        const timeSinceNudge = Date.now() - lastActivityTime;
        if (timeSinceNudge > 9000) {
          console.log('⚠️ No response after nudge, bridging to human');
          supabase.from('call_logs')
            .update({ 
              handoff: true, 
              handoff_reason: 'silence_timeout',
              fail_path: 'silence_bridge'
            })
            .eq('call_sid', callSid)
            .then();
        }
      }, 3000);
    }
  }, 2000);

  // Handle Twilio Media Stream events
  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    
    if (data.event === 'start') {
      streamSid = data.start.streamSid;
      handshakeCompleted = true;
      clearTimeout(handshakeWatchdog);
      
      const handshakeTime = Date.now() - handshakeStartTime;
      console.log(`✅ Media stream started (handshake: ${handshakeTime}ms) - NO PII logged`);
      
      // Record successful handshake evidence - NO PII
      supabase.from('voice_stream_logs').upsert({
        call_sid: callSid,
        started_at: new Date(handshakeStartTime).toISOString(),
        connected_at: new Date().toISOString(),
        elapsed_ms: handshakeTime,
        fell_back: false
      }, { onConflict: 'call_sid' }).then();
      
      // Update call log with session ID and handshake metrics - NO PII
      supabase.from('call_logs')
        .update({ 
          llm_session_id: streamSid,
          captured_fields: { handshake_ms: handshakeTime, stream_fallback: false }
        })
        .eq('call_sid', callSid)
        .then();
        
    } else if (data.event === 'media' && openaiWs.readyState === WebSocket.OPEN) {
      // Forward audio to OpenAI
      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.media.payload
      }));
      
    } else if (data.event === 'stop') {
      console.log('📞 Call ended');
      
      // Calculate conversation metrics
      const conversationDuration = Math.floor((Date.now() - conversationStartTime) / 1000);
      const avgSentiment = sentimentHistory.length > 0
        ? sentimentHistory.reduce((a, b) => a + b, 0) / sentimentHistory.length
        : null;
      
      // Save transcript and captured fields with compressed metadata
      await supabase.from('call_logs')
        .update({
          transcript: transcript,
          captured_fields: {
            ...capturedFields,
            dur_s: conversationDuration,
            turns: turnCount,
            sent: avgSentiment,
            safe: preset.safety_guardrails ? 1 : 0
          },
          ended_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('call_sid', callSid);
      
      // Send transcript email asynchronously
      fetch(`${supabaseUrl}/functions/v1/send-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ callSid })
      }).catch(err => console.error('Failed to trigger transcript email:', err));
      
      openaiWs.close();
      clearInterval(silenceCheckInterval);
    }
  };

  socket.onclose = () => {
    console.log('Twilio stream closed');
    openaiWs?.close();
    clearInterval(silenceCheckInterval);
  };

  socket.onerror = (error) => {
    console.error('Socket error:', error);
  };

  return response;
});
