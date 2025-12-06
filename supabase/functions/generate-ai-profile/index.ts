/**
 * Generate AI Personality Profile
 *
 * Creates customized AI personality profiles based on
 * business questionnaire responses.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";
import { withSecurity, SecurityContext, successResponse, errorResponse, validateRequest } from "../_shared/security-middleware.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

interface ProfileRequest {
  organizationId: string;
  profileName: string;
  businessType: string;
  industry: string;
  companySize: string;
  targetAudience: string;
  toneStyle: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  communicationStyle: 'direct' | 'conversational' | 'detailed';
  empathyLevel: 'low' | 'moderate' | 'high';
  interruptionAllowed: boolean;
  patienceLevel: 'low' | 'moderate' | 'high';
  followUpStyle: 'aggressive' | 'gentle' | 'minimal';
  customInstructions?: Record<string, unknown>;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'Maintain a professional, business-like demeanor while being approachable.',
  friendly: 'Be warm, personable, and create a welcoming atmosphere.',
  formal: 'Use formal language and maintain a respectful, traditional approach.',
  casual: 'Be relaxed and conversational, like talking to a friend.',
  empathetic: 'Show deep understanding and compassion for caller concerns.',
};

const COMMUNICATION_DESCRIPTIONS: Record<string, string> = {
  direct: 'Get to the point quickly. Be concise and efficient.',
  conversational: 'Engage in natural dialogue. Allow for back-and-forth discussion.',
  detailed: 'Provide comprehensive information. Explain thoroughly.',
};

const EMPATHY_DESCRIPTIONS: Record<string, string> = {
  low: 'Focus on facts and solutions rather than emotions.',
  moderate: 'Acknowledge feelings while maintaining focus on resolution.',
  high: 'Prioritize emotional validation. Take time to understand and relate.',
};

/**
 * Generate system prompt using AI
 */
async function generateSystemPrompt(profile: ProfileRequest): Promise<string> {
  const prompt = `Create a system prompt for an AI receptionist with these characteristics:

Business Details:
- Business Type: ${profile.businessType}
- Industry: ${profile.industry}
- Company Size: ${profile.companySize}
- Target Audience: ${profile.targetAudience}

Personality Settings:
- Tone: ${profile.toneStyle} - ${TONE_DESCRIPTIONS[profile.toneStyle]}
- Communication: ${profile.communicationStyle} - ${COMMUNICATION_DESCRIPTIONS[profile.communicationStyle]}
- Empathy: ${profile.empathyLevel} - ${EMPATHY_DESCRIPTIONS[profile.empathyLevel]}
- Patience: ${profile.patienceLevel}
- Follow-up Style: ${profile.followUpStyle}
- Can Interrupt: ${profile.interruptionAllowed ? 'Yes, when appropriate' : 'No, always let caller finish'}

Custom Instructions: ${JSON.stringify(profile.customInstructions || {})}

Generate a comprehensive system prompt that:
1. Defines the AI's role and responsibilities
2. Sets the appropriate tone and communication style
3. Includes guidelines for handling common scenarios
4. Provides escalation criteria
5. Ensures booking flow handling
6. Maintains brand consistency

The prompt should be detailed but under 1500 characters.`;

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
          {
            role: 'system',
            content: 'You are an expert at creating AI system prompts for customer service applications. Create prompts that are specific, actionable, and maintain consistent personality.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackPrompt(profile);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackPrompt(profile);
  }
}

/**
 * Generate fallback prompt without AI
 */
function generateFallbackPrompt(profile: ProfileRequest): string {
  return `You are an AI receptionist for a ${profile.businessType} in the ${profile.industry} industry.

PERSONALITY:
- Tone: ${TONE_DESCRIPTIONS[profile.toneStyle]}
- Communication: ${COMMUNICATION_DESCRIPTIONS[profile.communicationStyle]}
- Empathy: ${EMPATHY_DESCRIPTIONS[profile.empathyLevel]}

GUIDELINES:
1. Always greet callers warmly and identify yourself as the AI assistant
2. ${profile.interruptionAllowed ? 'You may politely interject to clarify or redirect' : 'Always wait for the caller to finish speaking'}
3. For booking requests, collect: name, contact info, preferred date/time, service type
4. ${profile.followUpStyle === 'aggressive' ? 'Proactively suggest next steps' : profile.followUpStyle === 'gentle' ? 'Gently offer assistance' : 'Wait for caller to request help'}
5. If caller is frustrated, ${profile.empathyLevel === 'high' ? 'take time to acknowledge and validate their feelings' : 'acknowledge briefly and focus on resolution'}

ESCALATION:
Transfer to human when:
- Caller explicitly requests human assistance
- Emergency or urgent safety matter
- Complex issue beyond booking scope
- Caller becomes extremely upset

Always end calls professionally and confirm any scheduled appointments.`;
}

async function handleGenerateProfile(req: Request, ctx: SecurityContext): Promise<Response> {
  const body = await req.json();

  // Validate request
  const validation = validateRequest<ProfileRequest>(body, {
    organizationId: { type: 'uuid', required: true },
    profileName: { type: 'string', required: true, maxLength: 100 },
    businessType: { type: 'string', required: true, maxLength: 100 },
    industry: { type: 'string', required: true, maxLength: 100 },
    companySize: { type: 'string', required: true, maxLength: 50 },
    targetAudience: { type: 'string', required: true, maxLength: 200 },
    toneStyle: { type: 'enum', required: true, allowedValues: ['professional', 'friendly', 'formal', 'casual', 'empathetic'] },
    communicationStyle: { type: 'enum', required: true, allowedValues: ['direct', 'conversational', 'detailed'] },
    empathyLevel: { type: 'enum', required: true, allowedValues: ['low', 'moderate', 'high'] },
    interruptionAllowed: { type: 'boolean', required: true },
    patienceLevel: { type: 'enum', required: true, allowedValues: ['low', 'moderate', 'high'] },
    followUpStyle: { type: 'enum', required: true, allowedValues: ['aggressive', 'gentle', 'minimal'] },
  });

  if (!validation.isValid) {
    return errorResponse(validation.errors.join(', '), 400, ctx.requestId);
  }

  const profileData = validation.sanitizedData as ProfileRequest;

  // Generate system prompt
  const systemPrompt = await generateSystemPrompt(profileData);

  // Deactivate existing active profiles
  await supabase
    .from('ai_personality_profiles')
    .update({ is_active: false })
    .eq('organization_id', profileData.organizationId)
    .eq('is_active', true);

  // Create new profile
  const { data: profile, error } = await supabase
    .from('ai_personality_profiles')
    .insert({
      organization_id: profileData.organizationId,
      profile_name: profileData.profileName,
      business_type: profileData.businessType,
      industry: profileData.industry,
      company_size: profileData.companySize,
      target_audience: profileData.targetAudience,
      tone_style: profileData.toneStyle,
      communication_style: profileData.communicationStyle,
      empathy_level: profileData.empathyLevel,
      interruption_allowed: profileData.interruptionAllowed,
      patience_level: profileData.patienceLevel,
      follow_up_style: profileData.followUpStyle,
      custom_instructions: profileData.customInstructions || {},
      system_prompt: systemPrompt,
      is_active: true,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    await enterpriseMonitor.logEvent({
      event_type: 'error',
      severity: 'high',
      component: 'ai-profile',
      operation: 'create_profile',
      message: `Profile creation failed: ${error.message}`,
      metadata: { error },
      request_id: ctx.requestId,
    });
    return errorResponse('Failed to create profile', 500, ctx.requestId);
  }

  await enterpriseMonitor.logEvent({
    event_type: 'info',
    severity: 'medium',
    component: 'ai-profile',
    operation: 'profile_created',
    message: `AI profile created: ${profile.id}`,
    metadata: { profile_id: profile.id, profile_name: profileData.profileName },
    request_id: ctx.requestId,
    user_id: ctx.userId,
  });

  return successResponse({
    profileId: profile.id,
    profileName: profile.profile_name,
    systemPrompt: profile.system_prompt,
    isActive: profile.is_active,
  }, 201, ctx.requestId);
}

serve(withSecurity(handleGenerateProfile, {
  endpoint: 'generate-ai-profile',
  requireAuth: true,
  rateLimit: 20,
}));
