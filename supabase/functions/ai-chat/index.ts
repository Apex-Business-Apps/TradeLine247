import { serve } from "std/http/server.ts";
import { createClient } from "supabase";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Rate limiting with sliding window (20 requests per minute)
const rateLimitWindow = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitWindow.get(clientId);

  if (!record || now > record.resetAt) {
    rateLimitWindow.set(clientId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting based on client IP or identifier
    const clientId = req.headers.get('x-client-info') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again in a minute.',
          type: 'rate_limit'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }

    const { messages, dealershipName, leadId } = await req.json();
    console.log('AI Chat request:', { messageCount: messages?.length, dealershipName, leadId });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // System prompt for AutoRepAi personality
    const systemPrompt = `You are AutoRepAi, ${dealershipName || "the dealership"}'s AI assistant. 

PERSONALITY:
- Warm, professional, and helpful
- Clear and concise communication
- Always introduce yourself as "AutoRepAi, ${dealershipName || "your dealership"}'s assistant"
- Adapt tone to context (formal for credit apps, friendly for general inquiries)

CAPABILITIES:
- Answer questions about vehicles, pricing, and availability
- Help schedule test drives
- Provide information about financing options
- Collect customer information for lead qualification
- Always respect consent preferences and compliance requirements

COMPLIANCE:
- Always obtain explicit consent before sending marketing messages (CASL/TCPA)
- Respect quiet hours (9 AM - 9 PM local time)
- Provide clear opt-out options
- Never share sensitive customer information

GUIDELINES:
- Be helpful but concise
- Ask clarifying questions when needed
- Suggest next steps (test drive, quote request, etc.)
- Route to human agents for complex negotiations or complaints
- Log all interactions for compliance`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    // Log interaction if leadId provided
    if (leadId) {
      try {
        await supabase.from('interactions').insert({
          lead_id: leadId,
          type: 'chat',
          direction: 'outbound',
          body: aiResponse,
          ai_generated: true,
        });
      } catch (error) {
        console.error('Failed to log interaction:', error);
      }
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
