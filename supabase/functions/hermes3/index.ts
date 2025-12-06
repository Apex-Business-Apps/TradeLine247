/**
 * OpenAI Chat Completion Function
 * 
 * This function provides an API endpoint for OpenAI model inference.
 * Supports streaming, function calling, and structured outputs.
 * 
 * Models supported: gpt-4, gpt-4-turbo, gpt-3.5-turbo, o1, o1-mini, etc.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

interface OpenAIRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

/**
 * Format messages for OpenAI API
 */
function formatOpenAIMessages(messages: ChatMessage[], systemPrompt?: string): Array<{role: string, content: string}> {
  const formatted: Array<{role: string, content: string}> = [];
  
  // Add system prompt if provided
  if (systemPrompt) {
    formatted.push({ role: 'system', content: systemPrompt });
  }
  
  // Format messages (OpenAI uses standard role/content format)
  for (const msg of messages) {
    // Skip tool messages in the main array (they go in tool_calls)
    if (msg.role !== 'tool') {
      formatted.push({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : 'system',
        content: msg.content,
      });
    }
  }
  
  return formatted;
}

/**
 * Format tools for OpenAI function calling
 * OpenAI uses a different format - tools are passed directly in the API call
 */
function formatOpenAITools(tools: ToolDefinition[]): Array<{type: string, function: any}> {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
    },
  }));
}

/**
 * OpenAI supports JSON mode via response_format parameter
 * No need for special system prompt
 */

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: OpenAIRequest = await req.json();
    const { 
      messages, 
      systemPrompt, 
      tools, 
      jsonSchema, 
      temperature = 0.7, 
      maxTokens = 1000, 
      stream = true,
      model = 'gpt-4o-mini' // Default to cost-effective model
    } = requestData;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required and cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(JSON.stringify({ 
          error: "Invalid message format. Each message must have 'role' and 'content'." 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ 
          error: "Message content too long. Maximum 10,000 characters per message." 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    // Format messages for OpenAI
    const formattedMessages = formatOpenAIMessages(messages, systemPrompt || 'You are a helpful AI assistant.');

    // Build request body
    const requestBody: any = {
      model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = formatOpenAITools(tools);
      requestBody.tool_choice = 'auto';
    }

    // Add JSON mode if schema provided
    if (jsonSchema) {
      requestBody.response_format = { type: 'json_object' };
      // Add schema instruction to system message
      const systemMsg = formattedMessages.find(m => m.role === 'system');
      if (systemMsg) {
        systemMsg.content += `\n\nYou must respond with valid JSON matching this schema: ${JSON.stringify(jsonSchema)}`;
      } else {
        formattedMessages.unshift({
          role: 'system',
          content: `You must respond with valid JSON matching this schema: ${JSON.stringify(jsonSchema)}`,
        });
      }
    }

    console.log('Sending request to OpenAI:', {
      model,
      messageCount: formattedMessages.length,
      hasTools: !!tools,
      hasJsonSchema: !!jsonSchema,
      stream,
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      let errorMessage = `OpenAI API error: ${response.status}`;
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

    // If streaming, return the stream directly
    if (stream && response.body) {
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OpenAI function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

