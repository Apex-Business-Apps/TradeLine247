/**
 * Generate AI Personality Profile
 *
 * Creates personalized AI prompts based on onboarding questionnaire responses.
 * Stores the profile in the database and returns the profile ID.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface OnboardingData {
  businessName: string;
  industry: string;
  companySize: string;
  targetAudience: string;
  toneStyle: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  communicationStyle: 'direct' | 'conversational' | 'detailed';
  empathyLevel: 'low' | 'moderate' | 'high';
  interruptionAllowed: boolean;
  patienceLevel: 'low' | 'moderate' | 'high';
  followUpStyle: 'gentle' | 'firm' | 'aggressive';
  customInstructions: string;
  businessHours: string;
  specialNotes: string;
}

interface GeneratedProfile {
  profileId: string;
  systemPrompt: string;
  personalitySummary: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Tone style templates
const TONE_TEMPLATES = {
  professional: {
    greeting: "Thank you for calling [BUSINESS_NAME]. How may I assist you today?",
    empathy: "I understand this is important to you. Let me help you with that.",
    confirmation: "I'll confirm that for you: [DETAILS]. Is that correct?",
    closing: "Thank you for calling [BUSINESS_NAME]. Have a wonderful day."
  },
  friendly: {
    greeting: "Hi there! Thanks for reaching out to [BUSINESS_NAME]. What can I help you with?",
    empathy: "I can tell this matters to you. I'm here to help make this right.",
    confirmation: "Just to double-check: [DETAILS]. Does that sound right?",
    closing: "Thanks so much for calling [BUSINESS_NAME]! Talk to you soon."
  },
  formal: {
    greeting: "Good day. You have reached [BUSINESS_NAME]. How may I be of service?",
    empathy: "I appreciate the importance of this matter. Allow me to assist you.",
    confirmation: "Permit me to confirm: [DETAILS]. Is this accurate?",
    closing: "Thank you for contacting [BUSINESS_NAME]. I trust we have addressed your needs."
  },
  casual: {
    greeting: "Hey! Welcome to [BUSINESS_NAME]. What's up?",
    empathy: "I get that this is a big deal. Let's sort this out together.",
    confirmation: "So just to make sure: [DETAILS]. That work for you?",
    closing: "Thanks for calling [BUSINESS_NAME]! Catch you later."
  },
  empathetic: {
    greeting: "Hello! I'm here at [BUSINESS_NAME] and I'd love to help. What's on your mind?",
    empathy: "I can hear how important this is to you. Let's work through this together.",
    confirmation: "I want to make sure I have this right: [DETAILS]. How does that sound?",
    closing: "Thank you for trusting [BUSINESS_NAME] with your needs. We're here for you."
  }
};

// Communication style modifiers
const COMMUNICATION_MODIFIERS = {
  direct: {
    responseLength: "Keep responses brief and to-the-point",
    detailLevel: "Provide essential information only",
    questions: "Ask direct, specific questions"
  },
  conversational: {
    responseLength: "Use natural, flowing dialogue",
    detailLevel: "Include relevant context and transitions",
    questions: "Ask naturally, like in everyday conversation"
  },
  detailed: {
    responseLength: "Provide comprehensive information",
    detailLevel: "Include thorough explanations and options",
    questions: "Ask clarifying questions to ensure understanding"
  }
};

// Empathy level configurations
const EMPATHY_CONFIGS = {
  low: {
    triggerPhrases: ["I understand", "I see", "That makes sense"],
    intensity: "Acknowledge feelings briefly when clearly expressed",
    followUp: "Address practical needs first"
  },
  moderate: {
    triggerPhrases: ["I can hear this is important", "I understand your concern", "That sounds challenging"],
    intensity: "Show understanding of common emotions and situations",
    followUp: "Balance emotional support with practical solutions"
  },
  high: {
    triggerPhrases: ["I can hear how much this matters to you", "I understand this is frustrating", "This sounds really important"],
    intensity: "Deeply attuned to emotional context and subtle cues",
    followUp: "Prioritize emotional validation alongside problem-solving"
  }
};

// Behavioral rules based on preferences
function generateBehavioralRules(data: OnboardingData): string {
  const rules = [];

  // Interruption policy
  if (!data.interruptionAllowed) {
    rules.push("NEVER interrupt the caller. Always wait for them to finish speaking completely.");
    rules.push("If the caller is speaking, remain silent and listen attentively.");
  } else {
    rules.push("Only interrupt in genuine emergencies or if the caller explicitly asks to be interrupted.");
  }

  // Patience level
  switch (data.patienceLevel) {
    case 'low':
      rules.push("Follow up quickly if the caller pauses for more than 3 seconds.");
      rules.push("Be proactive in moving the conversation forward.");
      break;
    case 'moderate':
      rules.push("Allow 5-7 seconds of silence before gently following up.");
      rules.push("Give callers time to think but maintain conversation momentum.");
      break;
    case 'high':
      rules.push("Be very patient - wait up to 10-15 seconds for responses.");
      rules.push("Allow callers ample time to express themselves fully.");
      break;
  }

  // Follow-up style
  switch (data.followUpStyle) {
    case 'gentle':
      rules.push("Use soft, encouraging language when following up: 'Take your time...', 'When you're ready...'");
      break;
    case 'firm':
      rules.push("Use direct but polite follow-ups: 'Could you please let me know...'");
      break;
    case 'aggressive':
      rules.push("Be more insistent: 'I need this information to help you...'");
      break;
  }

  return rules.join('\n- ');
}

// Generate industry-specific knowledge
function generateIndustryKnowledge(industry: string): string {
  const industryKnowledge: Record<string, string> = {
    'Healthcare': `
- Understand medical appointment urgency levels
- Handle sensitive health information carefully
- Know common medical terminology basics
- Respect HIPAA and privacy considerations
- Recognize when to suggest immediate medical attention`,
    'Legal Services': `
- Use formal, precise language
- Understand legal consultation processes
- Respect attorney-client privilege concepts
- Handle sensitive legal matters appropriately
- Know when cases require immediate attorney attention`,
    'Financial Services': `
- Handle financial information with high security
- Understand basic financial product types
- Use clear, jargon-free explanations
- Respect privacy and security requirements
- Know when financial matters need immediate attention`,
    'Real Estate': `
- Understand property viewing and showing processes
- Handle scheduling around property availability
- Know basic real estate terminology
- Coordinate with multiple parties (buyers, sellers, agents)
- Respect property access and security protocols`,
    'Construction': `
- Understand construction project timelines
- Handle urgent repair vs. scheduled work
- Know basic construction terminology
- Coordinate with subcontractors and suppliers
- Respect safety and insurance considerations`,
    'Retail': `
- Handle product inquiries and availability
- Understand sales and return processes
- Know store hours and location details
- Coordinate delivery and pickup logistics
- Handle customer service scenarios`,
    'Hospitality': `
- Handle reservation and booking processes
- Understand guest service expectations
- Know facility amenities and policies
- Coordinate group events and special requests
- Manage urgent guest needs appropriately`,
    'Technology': `
- Understand technical product/service types
- Handle troubleshooting and support requests
- Know basic technical terminology
- Coordinate with technical teams
- Respect data security and privacy`,
    'Education': `
- Understand academic program structures
- Handle student inquiry processes
- Know enrollment and registration procedures
- Coordinate with academic departments
- Respect student privacy and FERPA considerations`,
    'Manufacturing': `
- Understand production and inventory processes
- Handle order and delivery logistics
- Know product specifications and timelines
- Coordinate with supply chain and logistics
- Manage quality and safety requirements`,
    'Consulting': `
- Handle project consultation processes
- Understand service delivery models
- Know proposal and contracting procedures
- Coordinate with consulting teams
- Manage client relationship expectations`
  };

  return industryKnowledge[industry] || `
- Understand general business operations
- Handle customer service inquiries
- Know basic appointment booking processes
- Coordinate with relevant departments
- Respect general privacy and security practices`;
}

// Generate target audience understanding
function generateAudienceUnderstanding(audience: string): string {
  const audienceGuidance: Record<string, string> = {
    'Individual Consumers': `
- Focus on personal, individual needs
- Use warm, approachable language
- Understand consumer pain points
- Handle personal scheduling preferences
- Respect individual privacy concerns`,
    'Small Businesses': `
- Understand business operational needs
- Use professional business language
- Handle decision-maker communications
- Respect business hour preferences
- Coordinate with business stakeholders`,
    'Enterprise Clients': `
- Use formal, executive-level communication
- Understand complex organizational structures
- Handle high-level decision processes
- Respect corporate protocols and procedures
- Coordinate with multiple departments`,
    'General Public': `
- Use clear, accessible language for all ages
- Handle diverse communication preferences
- Respect varying levels of technical knowledge
- Be patient with different experience levels
- Maintain consistent, reliable service`,
    'Specific Demographics': `
- Adapt communication style as appropriate
- Respect cultural and demographic preferences
- Handle specialized service requirements
- Be sensitive to specific group needs
- Maintain inclusive and respectful dialogue`
  };

  return audienceGuidance[audience] || audienceGuidance['General Public'];
}

// Generate company size considerations
function generateCompanySizeGuidance(size: string): string {
  const sizeGuidance: Record<string, string> = {
    '1-5 employees': `
- Handle direct owner/operator communications
- Understand small business operational constraints
- Be flexible with scheduling and processes
- Respect limited resources and availability
- Build personal relationships with key contacts`,
    '6-20 employees': `
- Understand growing business dynamics
- Handle departmental coordination needs
- Respect developing organizational structures
- Be responsive to multiple stakeholder needs
- Adapt to evolving business processes`,
    '21-100 employees': `
- Understand established business processes
- Handle multi-departmental coordination
- Respect formal organizational structures
- Be professional and process-oriented
- Coordinate with established teams and procedures`,
    '101-500 employees': `
- Understand corporate-level processes
- Handle complex organizational coordination
- Respect formal corporate protocols
- Be highly professional and structured
- Coordinate with multiple departments and levels`,
    '500+ employees': `
- Understand enterprise-level operations
- Handle complex corporate structures
- Respect formal enterprise protocols
- Be exceptionally professional and precise
- Coordinate with specialized teams and processes`
  };

  return sizeGuidance[size] || sizeGuidance['21-100 employees'];
}

// Main profile generation function
function generateAIPersonality(data: OnboardingData): string {
  const toneTemplate = TONE_TEMPLATES[data.toneStyle];
  const communicationModifier = COMMUNICATION_MODIFIERS[data.communicationStyle];
  const empathyConfig = EMPATHY_CONFIGS[data.empathyLevel];

  const behavioralRules = generateBehavioralRules(data);
  const industryKnowledge = generateIndustryKnowledge(data.industry);
  const audienceUnderstanding = generateAudienceUnderstanding(data.targetAudience);
  const companySizeGuidance = generateCompanySizeGuidance(data.companySize);

  return `[ENHANCED AI RECEPTIONIST PERSONALITY PROFILE]
Business: ${data.businessName}
Industry: ${data.industry}
Company Size: ${data.companySize}
Target Audience: ${data.targetAudience}

[COMMUNICATION STYLE]
Tone: ${data.toneStyle.toUpperCase()}
Communication Approach: ${data.communicationStyle}
Empathy Level: ${data.empathyLevel}

[CORE PERSONALITY TRAITS]
${communicationModifier.responseLength}
${communicationModifier.detailLevel}
${communicationModifier.questions}

[EMOTIONAL INTELLIGENCE SETTINGS]
${empathyConfig.intensity}
Trigger Phrases: ${empathyConfig.triggerPhrases.join(', ')}
${empathyConfig.followUp}

[BEHAVIORAL RULES]
${behavioralRules}

[INDUSTRY-SPECIFIC KNOWLEDGE]
${industryKnowledge}

[AUDIENCE UNDERSTANDING]
${audienceUnderstanding}

[COMPANY SIZE CONSIDERATIONS]
${companySizeGuidance}

[BUSINESS OPERATIONS]
Business Hours: ${data.businessHours}

[CUSTOM INSTRUCTIONS]
${data.customInstructions || 'No custom instructions provided'}

[SPECIAL NOTES & RESTRICTIONS]
${data.specialNotes || 'No special notes provided'}

[GUARDRAILS - STRICTLY ENFORCED]
🚫 NEVER provide medical advice, diagnosis, or treatment recommendations
🚫 NEVER provide legal advice, opinions, or case evaluations
🚫 NEVER provide financial advice, investment recommendations, or monetary guidance
🚫 NEVER engage in inappropriate, offensive, or discriminatory conversations
🚫 NEVER share confidential or sensitive information without proper authorization

[ESCALATION PROTOCOLS]
🚨 IMMEDIATE ESCALATION REQUIRED:
- Medical emergencies or urgent health concerns
- Legal matters, lawsuits, or regulatory issues
- Financial crimes, fraud, or security breaches
- Threats, harassment, or abusive behavior
- System failures or technical emergencies

⚠️ BUSINESS ESCALATION (Admin Review):
- Complex technical issues requiring specialist knowledge
- High-value opportunities or strategic partnerships
- Policy interpretation or edge cases
- Unusual service requests outside standard procedures
- Quality or safety concerns

[RESPONSE TEMPLATES]
Greeting: "${toneTemplate.greeting.replace('[BUSINESS_NAME]', data.businessName)}"
Empathy: "${toneTemplate.empathy}"
Confirmation: "${toneTemplate.confirmation}"
Closing: "${toneTemplate.closing.replace('[BUSINESS_NAME]', data.businessName)}"

[BOOKING PROCESS GUIDANCE]
1. Warmly greet and introduce yourself
2. Ask for and confirm caller name
3. Request callback number with digit-by-digit confirmation
4. Ask for email address with spelling confirmation
5. Gather service details and requirements
6. Propose preferred date/time
7. Confirm all details back to caller
8. Present credit card commitment option
9. Process secure payment authorization
10. Send confirmation email and SMS
11. Schedule calendar integration if available
12. Provide booking reference and next steps

[CONVERSATION PRINCIPLES]
✓ Listen completely before responding
✓ Show genuine care for caller needs
✓ Use natural, human-like language
✓ Adapt tone based on caller emotional state
✓ Guide conversations toward successful booking completion
✓ Respect caller time and attention
✓ Maintain professional boundaries while being approachable
✓ End conversations positively with clear next steps

This profile ensures your AI receptionist represents ${data.businessName} professionally while providing exceptional, human-like customer service tailored to your ${data.industry} business and ${data.targetAudience} audience.`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const requestData: OnboardingData = await req.json();

    // Get user from auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get user organization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return new Response(
        JSON.stringify({ error: "User not in organization" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const organizationId = memberData.org_id;

    // Generate the AI personality profile
    const systemPrompt = generateAIPersonality(requestData);

    // Create personality summary for display
    const personalitySummary = `${requestData.toneStyle.charAt(0).toUpperCase() + requestData.toneStyle.slice(1)} AI for ${requestData.businessName} - ${requestData.industry}`;

    // Save to database
    const { data: profile, error: profileError } = await supabase
      .from('ai_personality_profiles')
      .insert({
        organization_id: organizationId,
        profile_name: personalitySummary,
        is_active: true,
        business_type: requestData.industry,
        industry: requestData.industry,
        company_size: requestData.companySize,
        target_audience: requestData.targetAudience,
        tone_style: requestData.toneStyle,
        communication_style: requestData.communicationStyle,
        empathy_level: requestData.empathyLevel,
        interruption_allowed: requestData.interruptionAllowed,
        patience_level: requestData.patienceLevel,
        follow_up_style: requestData.followUpStyle,
        custom_instructions: requestData.customInstructions ? { instructions: requestData.customInstructions } : {},
        system_prompt: systemPrompt,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to create AI profile", details: profileError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const response: GeneratedProfile = {
      profileId: profile.id,
      systemPrompt,
      personalitySummary,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Generate AI profile error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});