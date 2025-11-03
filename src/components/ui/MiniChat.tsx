import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, User, Loader2, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatIcon } from './ChatIcon';
import { cn } from '@/lib/utils';
import { debounce, prefersReducedMotion, batchUpdates } from '@/lib/performanceOptimizations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Format timestamp for display
const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

export const MiniChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Optimized scroll with reduced motion support and throttling
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return;
    
    if (prefersReducedMotion()) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Debounced scroll to avoid excessive scrolling during rapid message updates
  const debouncedScroll = useMemo(
    () => debounce(scrollToBottom, 50),
    [scrollToBottom]
  );

  useEffect(() => {
    batchUpdates(debouncedScroll);
  }, [messages, debouncedScroll]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    try {
      console.log('Sending chat request with', messages.length + 1, 'messages');
      
      // Use Supabase client for proper authentication
      const { data, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      console.log('Chat function invoked');

      if (functionError) {
        console.error('Chat API error:', functionError);
        throw new Error(functionError.message || 'Chat function error');
      }

      // Add assistant message with the response
      assistantContent = data?.content || data?.message || 'I apologize, but I didn\'t receive a complete response. Please try asking again.';
      
      setMessages(prev => [...prev, { ...assistantMessage, content: assistantContent }]);

      console.log('Chat request completed successfully');

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message?.includes('429')) {
        errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'The AI service is temporarily unavailable. Please try again later.';
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: errorMessage }
            : msg
        )
      );

      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Delay welcome message slightly for better UX
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Hello! I\'m here to help you with questions about TradeLine 24/7\'s AI receptionist services. How can I assist you today?',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }, 300);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const minimizeChat = () => {
    setIsOpen(false);
  };

  // Handle Esc key to close chat
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  return (
    <>
      {/* Chat Launcher Button - relocated on mobile to avoid nav/footer clash */}
      <button
        onClick={openChat}
        aria-expanded={isOpen}
        aria-controls="mini-chat-dialog"
        className={cn(
          "fixed right-4 bottom-4 sm:bottom-4 max-sm:bottom-20 z-[60] rounded-full shadow-lg",
          "p-3 bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !isOpen && "animate-bounce-subtle hover:animate-none"
        )}
      >
        <span className="sr-only">Open chat</span>
        <ChatIcon size="md" className="w-[22px] h-[22px] brightness-0 invert" aria-hidden="true" />
        {messages.length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" aria-label="Unread messages" />
        )}
      </button>

      {/* Chat Dialog */}
      {isOpen && (
        <div
          id="mini-chat-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mini-chat-title"
          className="fixed right-4 bottom-20 z-[60] w-[360px] max-w-[90vw] h-[500px] rounded-2xl shadow-2xl bg-background/95 backdrop-blur-sm border border-border/50 flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ChatIcon size="sm" className="w-4 h-4" />
              </div>
              <div>
                <h2 id="mini-chat-title" className="text-base font-semibold text-foreground">
                  TradeLine 24/7 Assistant
                </h2>
                <p className="text-xs text-muted-foreground">Online • Usually replies instantly</p>
              </div>
            </div>
            <button
              onClick={minimizeChat}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Minimize chat"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                  <ChatIcon size="lg" className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Start a conversation</p>
                <p className="text-xs text-muted-foreground">Ask me anything about TradeLine 24/7</p>
              </div>
            )}
            
            {messages.map((message, index) => {
              // Only animate last few messages for performance
              const shouldAnimate = index >= messages.length - 3 && !prefersReducedMotion();
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                    shouldAnimate && "animate-in fade-in slide-in-from-bottom-2 duration-300"
                  )}
                  style={shouldAnimate ? { animationDelay: `${Math.min(index * 30, 150)}ms` } : undefined}
                >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    <ChatIcon size="sm" className="w-4 h-4 brightness-0 invert" />
                  </div>
                )}
                
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <span className={cn(
                    "text-xs text-muted-foreground px-2",
                    message.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                )}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  <ChatIcon size="sm" className="w-4 h-4 brightness-0 invert" />
                </div>
                <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-gradient-to-t from-background to-background/95">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className={cn(
                    "w-full px-4 py-2.5 pr-10 border rounded-2xl bg-background text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                    input.trim() && "shadow-sm"
                  )}
                  aria-label="Chat input"
                />
                {input.trim().length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Press Enter to send
                  </span>
                )}
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl",
                  "hover:bg-primary/90 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "shadow-sm hover:shadow-md"
                )}
                aria-label="Send message"
              >
                <Send size={18} className={cn("transition-transform duration-200", input.trim() && "translate-x-0.5 translate-y-0.5")} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              AI-powered responses • {messages.length > 0 && `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
