/**
 * Enhanced Voice Stream - Enterprise Grade
 *
 * Real-time voice streaming with emotional recognition,
 * booking intent detection, and escalation triggers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";
import { withSecurity, SecurityContext, successResponse, errorResponse } from "../_shared/security-middleware.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

interface VoiceStreamRequest {
  callSid: string;
  organizationId: string;
  streamSid?: string;
  audioChunk?: string; // Base64 encoded audio
  transcriptChunk?: string;
  metadata?: Record<string, unknown>;
}

interface EmotionalState {
  primary: 'neutral' | 'happy' | 'frustrated' | 'confused' | 'urgent' | 'angry';
  confidence: number;
  indicators: string[];
}

interface IntentAnalysis {
  primaryIntent: 'booking' | 'inquiry' | 'complaint' | 'support' | 'emergency' | 'unknown';
  confidence: number;
  bookingSignals: string[];
  escalationRequired: boolean;
  escalationReason?: string;
}

// Emotional keywords for analysis
const EMOTIONAL_KEYWORDS: Record<string, string[]> = {
  frustrated: ['frustrated', 'annoying', 'ridiculous', 'terrible', 'awful', 'hate', 'worst'],
  urgent: ['urgent', 'emergency', 'immediately', 'asap', 'right now', 'critical'],
  angry: ['angry', 'furious', 'unacceptable', 'outrageous', 'sue', 'lawyer', 'complaint'],
  confused: ['confused', 'don\'t understand', 'what do you mean', 'unclear', 'lost'],
  happy: ['thank you', 'great', 'wonderful', 'appreciate', 'helpful', 'amazing'],
};

// Booking intent signals
const BOOKING_SIGNALS = [
  'appointment', 'schedule', 'book', 'reserve', 'available', 'when can',
  'meeting', 'consultation', 'visit', 'come in', 'see someone'
];

// Escalation triggers
const ESCALATION_TRIGGERS = [
  'speak to manager', 'supervisor', 'human', 'real person',
  'emergency', 'urgent', 'lawsuit', 'lawyer', 'media', 'news'
];

/**
 * Analyze emotional state from transcript
 */
function analyzeEmotionalState(transcript: string): EmotionalState {
  const lowerTranscript = transcript.toLowerCase();
  const indicators: string[] = [];
  const scores: Record<string, number> = {
    neutral: 50,
    happy: 0,
    frustrated: 0,
    confused: 0,
    urgent: 0,
    angry: 0,
  };

  // Check for emotional keywords
  for (const [emotion, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTranscript.includes(keyword)) {
        scores[emotion] += 20;
        indicators.push(`keyword:${keyword}`);
      }
    }
  }

  // Check for punctuation patterns
  const exclamationCount = (transcript.match(/!/g) || []).length;
  const questionCount = (transcript.match(/\?/g) || []).length;
  const capsRatio = (transcript.match(/[A-Z]/g) || []).length / transcript.length;

  if (exclamationCount > 2) {
    scores.frustrated += 10;
    scores.angry += 10;
    indicators.push('multiple_exclamations');
  }

  if (capsRatio > 0.5 && transcript.length > 10) {
    scores.angry += 15;
    indicators.push('excessive_caps');
  }

  if (questionCount > 3) {
    scores.confused += 10;
    indicators.push('multiple_questions');
  }

  // Find primary emotion
  let primary: EmotionalState['primary'] = 'neutral';
  let maxScore = scores.neutral;

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primary = emotion as EmotionalState['primary'];
    }
  }

  return {
    primary,
    confidence: Math.min(100, maxScore) / 100,
    indicators,
  };
}

/**
 * Analyze intent from transcript
 */
function analyzeIntent(transcript: string): IntentAnalysis {
  const lowerTranscript = transcript.toLowerCase();
  const bookingSignals: string[] = [];
  let escalationRequired = false;
  let escalationReason: string | undefined;

  // Check for booking signals
  for (const signal of BOOKING_SIGNALS) {
    if (lowerTranscript.includes(signal)) {
      bookingSignals.push(signal);
    }
  }

  // Check for escalation triggers
  for (const trigger of ESCALATION_TRIGGERS) {
    if (lowerTranscript.includes(trigger)) {
      escalationRequired = true;
      escalationReason = `Escalation trigger detected: ${trigger}`;
      break;
    }
  }

  // Determine primary intent
  let primaryIntent: IntentAnalysis['primaryIntent'] = 'unknown';
  let confidence = 0.3;

  if (bookingSignals.length >= 2) {
    primaryIntent = 'booking';
    confidence = 0.8 + (bookingSignals.length * 0.05);
  } else if (bookingSignals.length === 1) {
    primaryIntent = 'booking';
    confidence = 0.6;
  } else if (escalationRequired) {
    primaryIntent = 'emergency';
    confidence = 0.9;
  } else if (lowerTranscript.includes('problem') || lowerTranscript.includes('issue') || lowerTranscript.includes('broken')) {
    primaryIntent = 'complaint';
    confidence = 0.7;
  } else if (lowerTranscript.includes('help') || lowerTranscript.includes('support') || lowerTranscript.includes('assist')) {
    primaryIntent = 'support';
    confidence = 0.7;
  } else if (lowerTranscript.includes('?')) {
    primaryIntent = 'inquiry';
    confidence = 0.5;
  }

  return {
    primaryIntent,
    confidence: Math.min(1, confidence),
    bookingSignals,
    escalationRequired,
    escalationReason,
  };
}

/**
 * Generate AI response based on context
 */
async function generateAIResponse(
  transcript: string,
  emotionalState: EmotionalState,
  intent: IntentAnalysis,
  organizationId: string
): Promise<string> {
  // Get AI personality profile
  const { data: profile } = await supabase
    .from('ai_personality_profiles')
    .select('system_prompt, tone_style, empathy_level')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  const systemPrompt = profile?.system_prompt || `You are a professional AI receptionist for TradeLine 24/7.
Be helpful, professional, and empathetic. If the caller wants to book an appointment,
guide them through the process. If they seem frustrated, acknowledge their feelings
and offer to help resolve their concerns.`;

  // Adjust prompt based on emotional state
  let emotionalAdjustment = '';
  if (emotionalState.primary === 'frustrated' || emotionalState.primary === 'angry') {
    emotionalAdjustment = '\n\nThe caller seems frustrated. Be extra empathetic and patient. Acknowledge their feelings before addressing their needs.';
  } else if (emotionalState.primary === 'confused') {
    emotionalAdjustment = '\n\nThe caller seems confused. Speak clearly and slowly. Offer to explain things step by step.';
  } else if (emotionalState.primary === 'urgent') {
    emotionalAdjustment = '\n\nThe caller has an urgent matter. Be efficient and prioritize their immediate needs.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt + emotionalAdjustment },
          { role: 'user', content: transcript },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I apologize, I'm having trouble processing your request. Let me connect you with someone who can help.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I apologize for the technical difficulty. Please hold while I connect you with a team member.";
  }
}

async function handleVoiceStream(req: Request, ctx: SecurityContext): Promise<Response> {
  const requestData: VoiceStreamRequest = await req.json();

  if (!requestData.callSid || !requestData.organizationId) {
    return errorResponse('Missing required fields: callSid, organizationId', 400, ctx.requestId);
  }

  const transcript = requestData.transcriptChunk || '';

  // Analyze emotional state
  const emotionalState = analyzeEmotionalState(transcript);

  // Analyze intent
  const intentAnalysis = analyzeIntent(transcript);

  // Log emotional context
  await enterpriseMonitor.logEvent({
    event_type: 'info',
    severity: 'low',
    component: 'voice-stream',
    operation: 'emotional_analysis',
    message: `Emotional state: ${emotionalState.primary} (${Math.round(emotionalState.confidence * 100)}%)`,
    metadata: {
      call_sid: requestData.callSid,
      emotional_state: emotionalState,
      intent: intentAnalysis,
    },
    request_id: ctx.requestId,
  });

  // Handle escalation
  if (intentAnalysis.escalationRequired) {
    await supabase.from('escalation_logs').insert({
      organization_id: requestData.organizationId,
      call_sid: requestData.callSid,
      escalation_type: intentAnalysis.primaryIntent === 'emergency' ? 'emergency' : 'complex_business',
      severity_level: emotionalState.primary === 'angry' ? 'critical' : 'high',
      trigger_reason: intentAnalysis.escalationReason,
      transcript_snippet: transcript.substring(0, 500),
      ai_analysis: JSON.stringify({ emotionalState, intentAnalysis }),
      status: 'pending',
    });

    await enterpriseMonitor.logSecurityEvent('suspicious_activity', {
      type: 'escalation_triggered',
      call_sid: requestData.callSid,
      reason: intentAnalysis.escalationReason,
    }, ctx.userId, 'high');
  }

  // Generate AI response
  const aiResponse = await generateAIResponse(
    transcript,
    emotionalState,
    intentAnalysis,
    requestData.organizationId
  );

  // Update call context with emotional data
  if (requestData.callSid) {
    await supabase
      .from('bookings')
      .update({
        emotional_context: {
          latest_state: emotionalState,
          intent: intentAnalysis,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('call_sid', requestData.callSid);
  }

  return successResponse({
    emotionalState,
    intentAnalysis,
    aiResponse,
    escalationTriggered: intentAnalysis.escalationRequired,
  }, 200, ctx.requestId);
}

serve(withSecurity(handleVoiceStream, {
  endpoint: 'enhanced-voice-stream',
  requireAuth: true,
  rateLimit: 1000, // Higher limit for streaming
}));
