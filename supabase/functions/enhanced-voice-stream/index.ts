/**
 * Enhanced Voice Stream with Emotional Recognition
 *
 * Advanced AI receptionist with emotional intelligence, humanized tone,
 * and sophisticated conversation management.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { performSafetyCheck, sanitizeForLogging, type SafetyConfig } from "../_shared/voiceSafety.ts";

// Emotional recognition patterns
const EMOTIONAL_PATTERNS = {
  urgency: {
    keywords: ['urgent', 'emergency', 'asap', 'right away', 'immediately', 'quickly', 'fast'],
    phrases: ['i need this done now', 'this is critical', 'time sensitive'],
    tone: 'calm_professional',
    response_style: 'immediate_action'
  },
  frustration: {
    keywords: ['frustrated', 'angry', 'upset', 'annoyed', 'disappointed', 'terrible'],
    phrases: ['this is unacceptable', 'i\'m very upset', 'this is ridiculous'],
    tone: 'empathetic_supportive',
    response_style: 'acknowledge_resolve'
  },
  confusion: {
    keywords: ['confused', 'unsure', 'don\'t understand', 'not clear', 'complicated'],
    phrases: ['i\'m not sure what you mean', 'this is confusing', 'can you explain'],
    tone: 'patient_clear',
    response_style: 'clarify_simplify'
  },
  excitement: {
    keywords: ['excited', 'wonderful', 'fantastic', 'amazing', 'great', 'awesome'],
    phrases: ['this is perfect', 'i\'m so excited', 'this sounds great'],
    tone: 'enthusiastic_warm',
    response_style: 'match_energy'
  },
  concern: {
    keywords: ['worried', 'concerned', 'anxious', 'nervous', 'scared'],
    phrases: ['i\'m worried about', 'is this safe', 'will this be okay'],
    tone: 'reassuring_confident',
    response_style: 'address_concerns'
  },
  satisfaction: {
    keywords: ['happy', 'satisfied', 'pleased', 'good', 'fine', 'okay'],
    phrases: ['that sounds good', 'i\'m happy with that', 'that works for me'],
    tone: 'warm_professional',
    response_style: 'confirm_positive'
  }
};

// Personality adaptation based on AI profile
function getPersonalityAdaptation(profile: any, emotionalContext: any) {
  const baseTone = profile?.tone_style || 'professional';
  const empathyLevel = profile?.empathy_level || 'moderate';
  const communicationStyle = profile?.communication_style || 'conversational';

  // Adapt tone based on emotional context
  let adaptedTone = baseTone;
  if (emotionalContext.primary_emotion) {
    switch (emotionalContext.primary_emotion) {
      case 'urgency':
        adaptedTone = 'calm_professional';
        break;
      case 'frustration':
        adaptedTone = empathyLevel === 'high' ? 'highly_empathetic' : 'empathetic_supportive';
        break;
      case 'confusion':
        adaptedTone = 'patient_clear';
        break;
      case 'excitement':
        adaptedTone = 'enthusiastic_warm';
        break;
      case 'concern':
        adaptedTone = 'reassuring_confident';
        break;
    }
  }

  return {
    tone: adaptedTone,
    empathy_level: empathyLevel,
    communication_style: communicationStyle,
    interruption_allowed: profile?.interruption_allowed || false,
    patience_level: profile?.patience_level || 'moderate'
  };
}

// Enhanced emotional analysis
function analyzeEmotionalContext(transcript: string, conversationHistory: any[]): any {
  const text = transcript.toLowerCase();
  let emotionScores = {
    urgency: 0,
    frustration: 0,
    confusion: 0,
    excitement: 0,
    concern: 0,
    satisfaction: 0
  };

  // Analyze current message
  for (const [emotion, patterns] of Object.entries(EMOTIONAL_PATTERNS)) {
    // Check keywords
    patterns.keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        emotionScores[emotion as keyof typeof emotionScores] += 2;
      }
    });

    // Check phrases
    patterns.phrases.forEach(phrase => {
      if (text.includes(phrase)) {
        emotionScores[emotion as keyof typeof emotionScores] += 3;
      }
    });
  }

  // Analyze conversation patterns
  const recentMessages = conversationHistory.slice(-3);
  const avgResponseLength = recentMessages.reduce((sum, msg) => sum + msg.length, 0) / recentMessages.length;

  // Conversation flow analysis
  let conversationFlow = 'normal';
  if (recentMessages.length >= 2) {
    const questionCount = recentMessages.filter(msg => msg.includes('?')).length;
    const shortResponses = recentMessages.filter(msg => msg.length < 20).length;

    if (questionCount >= 2) conversationFlow = 'clarification_needed';
    if (shortResponses >= 2) conversationFlow = 'frustrated_or_rushed';
  }

  // Determine primary emotion
  const primaryEmotion = Object.entries(emotionScores)
    .sort(([,a], [,b]) => b - a)[0][0];

  // Contextual intensity
  const maxScore = Math.max(...Object.values(emotionScores));
  const intensity = maxScore > 3 ? 'high' : maxScore > 1 ? 'moderate' : 'low';

  return {
    primary_emotion: primaryEmotion,
    emotion_scores: emotionScores,
    intensity,
    conversation_flow: conversationFlow,
    avg_response_length: avgResponseLength,
    needs_empathy: ['frustration', 'concern', 'confusion'].includes(primaryEmotion),
    suggests_urgency: primaryEmotion === 'urgency' && intensity === 'high'
  };
}

// Generate humanized response based on emotional context
function generateHumanizedResponse(
  baseResponse: string,
  emotionalContext: any,
  personality: any,
  conversationHistory: any[]
): string {
  let response = baseResponse;

  // Adapt based on emotion
  switch (emotionalContext.primary_emotion) {
    case 'urgency':
      if (emotionalContext.intensity === 'high') {
        response = `I completely understand this needs immediate attention. ${response}`;
      } else {
        response = `I appreciate you letting me know this is time-sensitive. ${response}`;
      }
      break;

    case 'frustration':
      if (personality.empathy_level === 'high') {
        response = `I'm truly sorry you're feeling frustrated about this. ${response} Is there anything else I can help clarify?`;
      } else {
        response = `I apologize for any inconvenience. ${response}`;
      }
      break;

    case 'confusion':
      response = `Let me make sure I understand correctly. ${response} Does that make sense, or would you like me to explain anything differently?`;
      break;

    case 'excitement':
      response = `That's wonderful to hear! ${response}`;
      break;

    case 'concern':
      response = `I want to reassure you that ${response} We're here to make this as smooth as possible for you.`;
      break;
  }

  // Add conversational elements based on personality
  if (personality.communication_style === 'conversational') {
    // Add natural conversation fillers occasionally
    if (Math.random() < 0.3 && !response.includes('?')) {
      const fillers = ['You know,', 'Actually,', 'Well,', 'Let me tell you,'];
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      response = `${filler} ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
    }
  }

  return response;
}

// Enhanced prompt with emotional intelligence
function getEnhancedVoicePrompt(businessName: string, humanNumber: string, personality?: any): string {
  const baseTone = personality?.tone_style || 'professional';
  const empathyLevel = personality?.empathy_level || 'moderate';

  return `[ENHANCED AI RECEPTIONIST - ${businessName.toUpperCase()}]

You are an emotionally intelligent AI receptionist with advanced conversational skills.

PERSONALITY CORE:
- Tone: ${baseTone} with genuine warmth
- Empathy Level: ${empathyLevel}
- Communication: Natural, human-like conversation
- Patience: High - never interrupt, always listen fully
- Adaptability: Adjust tone based on caller's emotional state

EMOTIONAL RECOGNITION CAPABILITIES:
1. DETECT EMOTION: Analyze tone, word choice, and context
2. ADAPT RESPONSE: Match caller's emotional state appropriately
3. SHOW EMPATHY: Acknowledge feelings before addressing needs
4. MAINTAIN CALM: Stay composed regardless of caller frustration
5. BUILD RAPPORT: Use conversational language, not robotic responses

CONVERSATION PRINCIPLES:
✓ Listen completely before responding
✓ Acknowledge emotions: "I understand you're frustrated..."
✓ Use natural transitions: "That makes sense...", "I see what you mean..."
✓ Ask clarifying questions gently
✓ Never interrupt - wait for natural pauses
✓ End conversations positively

BOOKING FLOW ENHANCEMENT:
- Read back information warmly: "So just to confirm..."
- Express enthusiasm: "I'd be happy to help with that"
- Handle objections empathetically
- Guide naturally through credit card commitment

RESPONSE STYLE GUIDELINES:
${baseTone === 'professional' ? '- Professional yet approachable' : ''}
${baseTone === 'friendly' ? '- Warm and conversational' : ''}
${baseTone === 'empathetic' ? '- Highly attuned to emotions' : ''}
${baseTone === 'casual' ? '- Relaxed, natural speech patterns' : ''}

${empathyLevel === 'high' ? 'HIGH EMPATHY MODE: Always acknowledge feelings first, use phrases like "I can hear this is important to you" or "I understand this is frustrating"' : ''}
${empathyLevel === 'moderate' ? 'MODERATE EMPATHY: Show understanding without over-dramatizing' : ''}

BOOKING FIELDS TO CAPTURE (with emotional sensitivity):
- caller_name: Ask warmly - "May I have your name please?"
- callback_number: Confirm digit-by-digit sensitively
- email: Spell back naturally
- job_summary: Listen fully, acknowledge complexity
- preferred_datetime: Be flexible and understanding

ESCALATION TRIGGERS:
🚨 IMMEDIATE ESCALATION NEEDED:
- Medical emergencies or health concerns
- Legal matters or lawsuits
- Financial advice requests
- Threats or abusive language
- System-level technical failures

⚠️ BUSINESS ESCALATION (Admin Review):
- Complex technical issues
- Unusual service requests
- High-value opportunities
- Policy interpretation needed

CURRENT CONTEXT:
Business: ${businessName}
Human Contact: ${humanNumber}
Current Date/Time: ${new Date().toISOString()}

Remember: You are a skilled conversationalist. Listen more than you speak. Show genuine care for the caller's needs. Guide them naturally through the booking process.`;
}

// Enhanced conversation management
function manageConversationFlow(
  currentMessage: string,
  conversationHistory: any[],
  emotionalContext: any,
  bookingProgress: any
): { action: string; priority: 'low' | 'medium' | 'high' | 'urgent' } {

  // Check for immediate escalation needs
  const escalationKeywords = [
    'medical', 'doctor', 'emergency', 'hospital', 'health',
    'lawsuit', 'legal action', 'lawyer', 'court',
    'financial advice', 'investment', 'money management',
    'threat', 'abuse', 'harassment'
  ];

  const hasEscalationTrigger = escalationKeywords.some(keyword =>
    currentMessage.toLowerCase().includes(keyword)
  );

  if (hasEscalationTrigger) {
    return { action: 'escalate_immediate', priority: 'urgent' };
  }

  // Check emotional state for support needs
  if (emotionalContext.primary_emotion === 'frustration' && emotionalContext.intensity === 'high') {
    return { action: 'provide_empathy', priority: 'high' };
  }

  // Check booking completion status
  const requiredFields = ['caller_name', 'callback_number', 'email', 'job_summary'];
  const completedFields = requiredFields.filter(field => bookingProgress[field]);
  const completionRate = completedFields.length / requiredFields.length;

  if (completionRate < 0.5) {
    return { action: 'gather_information', priority: 'medium' };
  }

  if (completionRate >= 0.75 && !bookingProgress.confirmed) {
    return { action: 'confirm_booking', priority: 'medium' };
  }

  return { action: 'continue_conversation', priority: 'low' };
}

// Main enhanced voice stream function
export async function handleEnhancedVoiceStream(
  websocket: WebSocket,
  env: any,
  callSid: string,
  organizationId: string
) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get organization configuration
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    // Get AI personality profile
    const { data: personality } = await supabase
      .from('ai_personality_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    // Get voice configuration
    const { data: voiceConfig } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Initialize conversation state
    let conversationHistory: any[] = [];
    let bookingProgress: any = {};
    let emotionalContext: any = { primary_emotion: 'neutral', intensity: 'low' };
    let consecutiveInterruptions = 0;

    // Enhanced system prompt
    const systemPrompt = getEnhancedVoicePrompt(
      org?.name || 'TradeLine 24/7',
      voiceConfig?.human_number_e164 || '+14319900222',
      personality
    );

    websocket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'transcription') {
          const transcript = message.transcript;

          // Analyze emotional context
          emotionalContext = analyzeEmotionalContext(transcript, conversationHistory);

          // Store emotional context in database for analytics
          await supabase
            .from('call_logs')
            .update({
              emotional_context: emotionalContext,
              updated_at: new Date().toISOString()
            })
            .eq('call_sid', callSid);

          // Manage conversation flow
          const flowDecision = manageConversationFlow(
            transcript,
            conversationHistory,
            emotionalContext,
            bookingProgress
          );

          // Handle escalation if needed
          if (flowDecision.action === 'escalate_immediate') {
            await supabase
              .from('escalation_logs')
              .insert({
                organization_id: organizationId,
                call_sid: callSid,
                escalation_type: 'emergency',
                severity_level: 'high',
                trigger_reason: `Detected escalation keywords in: "${transcript}"`,
                transcript_snippet: transcript,
                ai_analysis: emotionalContext
              });

            // Immediate handoff to human
            websocket.send(JSON.stringify({
              type: 'response',
              text: "I understand this requires immediate human assistance. Let me connect you right away.",
              action: 'escalate'
            }));
            return;
          }

          // Generate AI response using enhanced prompt
          const enhancedPrompt = `${systemPrompt}

EMOTIONAL CONTEXT: ${JSON.stringify(emotionalContext)}
CONVERSATION HISTORY: ${conversationHistory.slice(-3).join(' | ')}
BOOKING PROGRESS: ${JSON.stringify(bookingProgress)}

USER MESSAGE: "${transcript}"

Respond naturally and empathetically. Do not interrupt. Guide conversation toward booking completion if appropriate.`;

          // Call AI service (placeholder - integrate with your AI provider)
          const aiResponse = await generateAIResponse(enhancedPrompt, {
            personality: getPersonalityAdaptation(personality, emotionalContext),
            emotionalContext,
            conversationHistory
          });

          // Humanize the response
          const humanizedResponse = generateHumanizedResponse(
            aiResponse,
            emotionalContext,
            getPersonalityAdaptation(personality, emotionalContext),
            conversationHistory
          );

          // Update conversation history
          conversationHistory.push(transcript);
          conversationHistory.push(humanizedResponse);

          // Send response
          websocket.send(JSON.stringify({
            type: 'response',
            text: humanizedResponse,
            emotional_context: emotionalContext,
            booking_progress: bookingProgress
          }));

          // Check for interruption pattern (anti-interruption safeguard)
          if (consecutiveInterruptions > 2) {
            websocket.send(JSON.stringify({
              type: 'warning',
              message: 'Please allow me to finish speaking before responding.'
            }));
          }

        } else if (message.type === 'booking_update') {
          // Update booking progress
          bookingProgress = { ...bookingProgress, ...message.data };

          // If booking is complete, trigger confirmation flow
          if (message.data.status === 'confirmed') {
            // Trigger email confirmation (this would call the send-booking-confirmation function)
            await supabase.functions.invoke('send-booking-confirmation', {
              body: {
                bookingId: message.data.bookingId,
                confirmationType: 'initial',
                channel: 'both'
              }
            });
          }
        }

      } catch (error) {
        console.error('Voice stream processing error:', error);
        websocket.send(JSON.stringify({
          type: 'error',
          message: 'I apologize, but I encountered an issue. Let me connect you with a human representative.'
        }));
      }
    };

    websocket.onclose = async () => {
      // Final emotional context summary
      await supabase
        .from('call_logs')
        .update({
          final_emotional_context: emotionalContext,
          conversation_summary: conversationHistory.join(' | ').substring(0, 1000),
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
    };

  } catch (error) {
    console.error('Enhanced voice stream initialization error:', error);
    websocket.send(JSON.stringify({
      type: 'error',
      message: 'Service initialization failed. Please try again.'
    }));
  }
}

// Placeholder AI response generation (integrate with your AI provider)
async function generateAIResponse(prompt: string, context: any): Promise<string> {
  // This should integrate with your AI service (OpenAI, Anthropic, etc.)
  // For now, return a placeholder response
  return "Thank you for sharing that with me. I understand your needs and would be happy to help arrange that for you.";
}