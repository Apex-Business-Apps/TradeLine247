import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatbotAvatar } from '@/components/assistant/ChatbotAvatar';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { telemetry } from '@/lib/observability/telemetry';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnhancedAIChatWidgetProps {
  dealershipName?: string;
  leadId?: string;
}

export function EnhancedAIChatWidget({ dealershipName, leadId }: EnhancedAIChatWidgetProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const locale = i18n.language.startsWith('fr') ? 'fr' : 'en';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = locale === 'fr'
        ? `Bonjour! Je suis AutoRepAi, l'assistant de ${dealershipName || 'notre concessionnaire'}. Comment puis-je vous aider aujourd'hui?`
        : `Hi! I'm AutoRepAi, ${dealershipName || 'your dealership'}'s assistant. How can I help you today?`;

      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, dealershipName, locale, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    const startTime = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          dealershipName,
          leadId,
          locale
        }
      });

      if (error) {
        if (error.message.includes('rate_limit') || error.message.includes('429')) {
          toast({
            title: locale === 'fr' ? 'Trop de requêtes' : 'Too Many Requests',
            description: locale === 'fr' 
              ? 'Veuillez patienter un moment avant de réessayer.'
              : 'Please wait a moment before trying again.',
            variant: 'destructive',
          });
        } else if (error.message.includes('payment_required') || error.message.includes('402')) {
          toast({
            title: locale === 'fr' ? 'Service temporairement indisponible' : 'Service Temporarily Unavailable',
            description: locale === 'fr'
              ? 'Veuillez contacter le support.'
              : 'Please contact support.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      const duration = performance.now() - startTime;
      telemetry.trackPerformance('ai_chat_response', duration, { locale, has_lead_id: !!leadId });

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      telemetry.error('AI chat error', { locale, has_lead_id: !!leadId }, error as Error);
      toast({
        title: locale === 'fr' ? 'Erreur' : 'Error',
        description: locale === 'fr'
          ? 'Impossible d\'envoyer le message. Veuillez réessayer.'
          : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        aria-label={locale === 'fr' ? 'Ouvrir le chat' : 'Open chat'}
      >
        <ChatbotAvatar size={32} />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-2">
          <ChatbotAvatar size={32} />
          <div>
            <CardTitle className="text-base">AutoRepAi</CardTitle>
            <p className="text-xs text-muted-foreground">
              {dealershipName || (locale === 'fr' ? 'Assistant IA' : 'AI Assistant')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {locale === 'fr' ? 'FR' : 'EN'}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label={locale === 'fr' ? 'Fermer le chat' : 'Close chat'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={locale === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
              disabled={isLoading}
              className="flex-1"
              aria-label={locale === 'fr' ? 'Message' : 'Message'}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              aria-label={locale === 'fr' ? 'Envoyer' : 'Send'}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {locale === 'fr'
              ? 'Vos conversations sont privées et sécurisées'
              : 'Your conversations are private and secure'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
