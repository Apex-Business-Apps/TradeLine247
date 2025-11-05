import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, MessageSquare, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Interaction {
  id: string;
  type: 'chat' | 'sms' | 'whatsapp' | 'messenger' | 'email' | 'phone_call' | 'note' | 'ai_summary';
  direction?: string;
  subject?: string;
  body?: string;
  ai_generated: boolean;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

interface LeadTimelineProps {
  leadId: string;
}

export function LeadTimeline({ leadId }: LeadTimelineProps) {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInteractions(data);
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    fetchInteractions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('lead-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          setInteractions(prev => [payload.new as Interaction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, fetchInteractions]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms':
      case 'whatsapp':
      case 'messenger': return <MessageSquare className="h-4 w-4" />;
      case 'phone_call': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'ai_summary': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500';
      case 'sms': return 'bg-green-500';
      case 'whatsapp': return 'bg-emerald-500';
      case 'messenger': return 'bg-indigo-500';
      case 'phone_call': return 'bg-purple-500';
      case 'chat': return 'bg-cyan-500';
      case 'note': return 'bg-gray-500';
      case 'ai_summary': return 'bg-violet-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('common.loading')}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          One-Timeline: All Interactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {interactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No interactions yet. Start engaging with this lead!
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction, index) => (
                <div key={interaction.id} className="relative">
                  {index !== interactions.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getTypeColor(interaction.type)} flex items-center justify-center text-white z-10`}>
                      {getIcon(interaction.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {interaction.type.toUpperCase()}
                        </span>
                        {interaction.direction && (
                          <Badge variant="outline" className="text-xs">
                            {interaction.direction}
                          </Badge>
                        )}
                        {interaction.ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            AutoRepAi
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(interaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {interaction.subject && (
                        <p className="font-medium text-sm">{interaction.subject}</p>
                      )}
                      {interaction.body && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {interaction.body.length > 200 
                            ? interaction.body.substring(0, 200) + '...'
                            : interaction.body
                          }
                        </p>
                      )}
                      {interaction.metadata && Object.keys(interaction.metadata).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Metadata</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(interaction.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
