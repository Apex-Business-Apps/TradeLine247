/**
 * Hermes 3 3B Inference Function
 * 
 * This function provides an API endpoint for Hermes 3 model inference.
 * It supports ChatML format, function calling, and structured outputs.
 * 
 * Note: This implementation assumes you have a Python service running
 * that handles the actual model inference. For local development,
 * you can use the Python implementation in docs/hermes3_service.py
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

interface Hermes3Request {
  messages: ChatMessage[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Format messages in ChatML format for Hermes 3
 */
function formatChatML(messages: ChatMessage[], systemPrompt?: string): string {
  let formatted = '';
  
  // Add system prompt if provided
  if (systemPrompt) {
    formatted += `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
  }
  
  // Format messages
  for (const msg of messages) {
    formatted += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }
  
  // Add assistant prompt for generation
  formatted += `<|im_start|>assistant\n`;
  
  return formatted;
}

/**
 * Format function calling system prompt
 */
function formatFunctionCallingPrompt(tools: ToolDefinition[]): string {
  const toolsJson = JSON.stringify(tools);
  return `You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> ${toolsJson} </tools> Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"} For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
<tool_call>
{"arguments": <args-dict>, "name": <function-name>}
</tool_call>`;
}

/**
 * Format JSON mode system prompt
 */
function formatJSONModePrompt(schema: Record<string, unknown>): string {
  const schemaStr = JSON.stringify(schema, null, 2);
  return `You are a helpful assistant that answers in JSON. Here's the json schema you must adhere to:\n<schema>\n${schemaStr}\n</schema>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: Hermes3Request = await req.json();
    const { messages, systemPrompt, tools, jsonSchema, temperature = 0.8, maxTokens = 750, stream = true } = requestData;

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

    // Determine system prompt based on mode
    let finalSystemPrompt = systemPrompt;
    if (tools && tools.length > 0) {
      finalSystemPrompt = formatFunctionCallingPrompt(tools);
    } else if (jsonSchema) {
      finalSystemPrompt = formatJSONModePrompt(jsonSchema);
    } else if (!finalSystemPrompt) {
      finalSystemPrompt = 'You are Hermes 3, a helpful AI assistant.';
    }

    // Format prompt in ChatML
    const formattedPrompt = formatChatML(messages, finalSystemPrompt);

    // Support multiple hosting providers
    const hostingProvider = Deno.env.get('HERMES3_HOSTING_PROVIDER') || 'huggingface';
    
    console.log('Sending request to Hermes 3 service:', {
      provider: hostingProvider,
      messageCount: messages.length,
      hasTools: !!tools,
      hasJsonSchema: !!jsonSchema,
      stream,
    });

    let response: Response;
    
    if (hostingProvider === 'huggingface') {
      // Hugging Face Inference API (Free tier: 30k requests/month)
      const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
      if (!HF_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY not configured');
      }
      
      response = await fetch(
        'https://api-inference.huggingface.co/models/NousResearch/Hermes-3-Llama-3.2-3B',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: formattedPrompt,
            parameters: {
              temperature,
              max_new_tokens: maxTokens,
              return_full_text: false,
            },
            options: {
              wait_for_model: true,
            },
          }),
        }
      );
    } else if (hostingProvider === 'together') {
      // Together AI (Free tier: $25 credits)
      const TOGETHER_API_KEY = Deno.env.get('TOGETHER_API_KEY');
      if (!TOGETHER_API_KEY) {
        throw new Error('TOGETHER_API_KEY not configured');
      }
      
      response = await fetch('https://api.together.xyz/inference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'NousResearch/Hermes-3-Llama-3.2-3B',
          prompt: formattedPrompt,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      });
    } else if (hostingProvider === 'custom') {
      // Custom service URL (for self-hosted, RunPod, Modal, etc.)
      const HERMES3_SERVICE_URL = Deno.env.get('HERMES3_SERVICE_URL') || 'http://localhost:8000/infer';
      
      response = await fetch(HERMES3_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formattedPrompt,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      });
    } else {
      throw new Error(`Unknown hosting provider: ${hostingProvider}. Use 'huggingface', 'together', or 'custom'`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hermes 3 service error:', response.status, errorText);
      
      return new Response(JSON.stringify({ 
        error: `Hermes 3 service error: ${response.status}`,
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
    console.error('Hermes 3 function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

