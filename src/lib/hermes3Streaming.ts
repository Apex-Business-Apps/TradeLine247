/**
 * Streaming client for Hermes 3 responses
 * Handles different response formats from various hosting providers
 */

export interface Hermes3Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface Hermes3StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Stream Hermes 3 response from Supabase function
 */
export async function streamHermes3Response(
  messages: Hermes3Message[],
  options: Hermes3StreamOptions = {}
): Promise<string> {
  const { onChunk, onComplete, onError, signal, systemPrompt, temperature = 0.7, maxTokens = 1000, model = 'gpt-4o-mini' } = options;
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hermes3`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          systemPrompt,
          temperature,
          maxTokens,
          model,
          stream: true,
        }),
        signal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    // Handle OpenAI SSE format (Server-Sent Events)
    // OpenAI returns: data: {"choices":[{"delta":{"content":"..."}}]}

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        // Handle SSE format (data: {...})
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            onComplete?.(fullResponse);
            return fullResponse;
          }

          try {
            const parsed = JSON.parse(data);
            
            // OpenAI format: data: {"choices":[{"delta":{"content":"..."}}]}
            if (parsed.choices?.[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              if (content) {
                fullResponse += content;
                onChunk?.(content);
              }
            }
            // Handle finish_reason (end of stream)
            else if (parsed.choices?.[0]?.finish_reason) {
              // Stream is complete
              onComplete?.(fullResponse);
              return fullResponse;
            }
          } catch (e) {
            // Skip invalid JSON chunks
            console.warn('Invalid JSON chunk:', data);
          }
        }
        // Handle non-SSE JSON responses (non-streaming OpenAI response)
        else if (line.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(line);
            // OpenAI non-streaming format
            if (parsed.choices?.[0]?.message?.content) {
              fullResponse = parsed.choices[0].message.content;
              onChunk?.(fullResponse);
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('Invalid JSON line:', line);
          }
        }
      }
    }

    // Process remaining buffer (if any)
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.choices?.[0]?.delta?.content) {
          const content = parsed.choices[0].delta.content;
          if (content) {
            fullResponse += content;
            onChunk?.(content);
          }
        }
      } catch (e) {
        // Buffer might be incomplete, that's okay
      }
    }

    onComplete?.(fullResponse);
    return fullResponse;
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

export class Hermes3StreamManager {
  private abortController: AbortController | null = null;

  async stream(
    messages: Hermes3Message[],
    options: Hermes3StreamOptions = {}
  ): Promise<string> {
    // Cancel previous stream if running
    this.cancel();
    
    this.abortController = new AbortController();
    
    return streamHermes3Response(messages, {
      ...options,
      signal: this.abortController.signal
    });
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  isStreaming(): boolean {
    return this.abortController !== null;
  }
}

