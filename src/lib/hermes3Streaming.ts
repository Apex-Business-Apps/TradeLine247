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
}

/**
 * Stream Hermes 3 response from Supabase function
 */
export async function streamHermes3Response(
  messages: Hermes3Message[],
  options: Hermes3StreamOptions = {}
): Promise<string> {
  const { onChunk, onComplete, onError, signal, systemPrompt, temperature = 0.8, maxTokens = 750 } = options;
  
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

    // Handle different response formats
    // Hugging Face returns: {"generated_text": "..."}
    // Together AI returns: SSE format
    // Custom services may return different formats

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
            
            // Hugging Face format
            if (parsed.generated_text) {
              const newText = parsed.generated_text.slice(fullResponse.length);
              if (newText) {
                fullResponse += newText;
                onChunk?.(newText);
              }
            }
            // Together AI / OpenAI-like format
            else if (parsed.choices?.[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              fullResponse += content;
              onChunk?.(content);
            }
            // Direct text response
            else if (parsed.text) {
              const newText = parsed.text.slice(fullResponse.length);
              if (newText) {
                fullResponse += newText;
                onChunk?.(newText);
              }
            }
            // Custom format: {response: "..."}
            else if (parsed.response) {
              const newText = parsed.response.slice(fullResponse.length);
              if (newText) {
                fullResponse += newText;
                onChunk?.(newText);
              }
            }
          } catch (e) {
            // Try parsing as plain text if JSON fails
            if (line.trim() && !line.startsWith('data: ')) {
              fullResponse += line;
              onChunk?.(line);
            }
          }
        }
        // Handle non-SSE JSON responses (Hugging Face sometimes returns this)
        else if (line.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.generated_text) {
              fullResponse = parsed.generated_text;
              onChunk?.(parsed.generated_text);
            } else if (parsed.response) {
              fullResponse = parsed.response;
              onChunk?.(parsed.response);
            }
          } catch (e) {
            // Not JSON, treat as plain text
            if (line.trim()) {
              fullResponse += line;
              onChunk?.(line);
            }
          }
        }
        // Plain text fallback
        else if (line.trim()) {
          fullResponse += line;
          onChunk?.(line);
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.generated_text) {
          const newText = parsed.generated_text.slice(fullResponse.length);
          if (newText) {
            fullResponse += newText;
            onChunk?.(newText);
          }
        }
      } catch (e) {
        if (buffer.trim()) {
          fullResponse += buffer;
          onChunk?.(buffer);
        }
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

