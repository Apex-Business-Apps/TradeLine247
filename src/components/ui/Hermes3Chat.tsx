import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, Loader2, X, Settings, Sparkles } from 'lucide-react';
import { streamHermes3Response, type Hermes3Message } from '@/lib/hermes3Streaming';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Card } from './card';
import { Badge } from './badge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Hermes3ChatProps {
  className?: string;
  defaultSystemPrompt?: string;
  showSettings?: boolean;
}

/**
 * Hermes 3 Chat Component
 * Simple and intuitive chat interface for Hermes 3 3B model
 */
export const Hermes3Chat: React.FC<Hermes3ChatProps> = ({
  className,
  defaultSystemPrompt = 'You are Hermes 3, a helpful AI assistant. Be concise, accurate, and friendly.',
  showSettings = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(750);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Create placeholder for streaming response
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Convert to Hermes3Message format
      const hermesMessages: Hermes3Message[] = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user',
          content: currentInput,
        },
      ];

      await streamHermes3Response(hermesMessages, {
        systemPrompt: systemPrompt || undefined,
        temperature,
        maxTokens,
        onChunk: (chunk) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        },
        onComplete: (fullResponse) => {
          setIsLoading(false);
          console.log('Hermes 3 response completed:', fullResponse.length, 'chars');
        },
        onError: (err) => {
          console.error('Hermes 3 error:', err);
          setIsLoading(false);
          
          let errorMessage = 'Sorry, I encountered an error. Please try again.';
          if (err.message?.includes('401') || err.message?.includes('403')) {
            errorMessage = 'Authentication error. Please check your API keys.';
          } else if (err.message?.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please wait a moment.';
          } else if (err.message?.includes('503')) {
            errorMessage = 'Model is loading. Please wait and try again.';
          }
          
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: errorMessage }
                : m
            )
          );
          
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      });
    } catch (err) {
      console.error('Chat error:', err);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: 'Chat cleared',
      description: 'Conversation history has been cleared.',
    });
  };

  return (
    <Card className={cn('flex flex-col h-[600px] max-h-[90vh] w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hermes 3 Chat</h2>
            <p className="text-xs text-muted-foreground">NousResearch • 3B Parameters</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="h-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* System Prompt Settings */}
      {showSystemPrompt && showSettings && (
        <div className="p-4 border-b bg-muted/30 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">System Prompt</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system prompt..."
              className="min-h-[60px] text-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome to Hermes 3</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Start a conversation with Hermes 3, a powerful 3B parameter language model
                fine-tuned for helpful, accurate responses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Badge variant="outline">Function Calling</Badge>
              <Badge variant="outline">Structured Outputs</Badge>
              <Badge variant="outline">ChatML Format</Badge>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap break-words text-sm">
                  {message.content || (isLoading && message.id === messages[messages.length - 1]?.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </span>
                  ) : message.content)}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Hermes 3 3B • ChatML Format • Research Use
        </p>
      </div>
    </Card>
  );
};

