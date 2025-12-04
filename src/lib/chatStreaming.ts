/**
 * Streaming chat client for chunked responses
 * Reduces perceived latency by displaying tokens as they arrive
 */

import { SUPABASE_FUNCTIONS, getSupabaseHeaders } from '@/config/api';

export interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamChatResponse(
  messages: StreamMessage[],
  options: StreamOptions = {}
): Promise<string> {
  const { onChunk, onComplete, onError, signal } = options;
  
  try {
    const response = await fetch(
      SUPABASE_FUNCTIONS.chat,
      {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ messages }),
        signal
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            onComplete?.(fullResponse);
            return fullResponse;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              fullResponse += content;
              onChunk?.(content);
            }
          } catch (e) {
            // Skip invalid JSON chunks
            console.warn('Invalid JSON chunk:', data);
          }
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

export class ChatStreamManager {
  private abortController: AbortController | null = null;

  async stream(messages: StreamMessage[], options: StreamOptions = {}): Promise<string> {
    // Cancel previous stream if running
    this.cancel();
    
    this.abortController = new AbortController();
    
    return streamChatResponse(messages, {
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
