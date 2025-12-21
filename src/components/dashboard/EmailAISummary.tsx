import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Tag, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailAISummaryProps {
  emailId: string;
  onDraftReply?: (draft: string) => void;
}

export default function EmailAISummary({ emailId, onDraftReply }: EmailAISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [draftReply, setDraftReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAISummary();
  }, [emailId]);

  const loadAISummary = async () => {
    try {
      setLoading(true);

      const { data: aiOutputs, error } = await supabase
        .from('email_ai_outputs')
        .select('*')
        .eq('email_id', emailId)
        .in('type', ['summary', 'tags']);

      if (error) throw error;

      aiOutputs?.forEach(output => {
        if (output.type === 'summary') {
          setSummary(output.content);
        } else if (output.type === 'tags') {
          try {
            setTags(JSON.parse(output.content));
          } catch {
            setTags([]);
          }
        }
      });

    } catch (error) {
      console.error('Failed to load AI summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDraftReply = async () => {
    try {
      setGeneratingDraft(true);

      const { data, error } = await supabase.functions.invoke('email-draft-reply', {
        body: { email_id: emailId }
      });

      if (error) throw error;

      setDraftReply(data.draft_reply);

      if (onDraftReply) {
        onDraftReply(data.draft_reply);
      }

      toast({
        title: 'Draft Generated',
        description: 'AI draft reply created successfully',
      });

    } catch (error) {
      console.error('Failed to generate draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate draft reply',
        variant: 'destructive',
      });
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Check if RAG features are enabled for this org
  const [featuresEnabled, setFeaturesEnabled] = useState(false);

  useEffect(() => {
    const checkFeatures = async () => {
      try {
        const { data: flags } = await supabase
          .from('feature_flags')
          .select('feature_name, enabled')
          .in('feature_name', ['RAG_FEATURE_ENABLED', 'EMAIL_AI_ENABLED']);

        const ragEnabled = flags?.find(f => f.feature_name === 'RAG_FEATURE_ENABLED')?.enabled;
        const emailEnabled = flags?.find(f => f.feature_name === 'EMAIL_AI_ENABLED')?.enabled;

        setFeaturesEnabled(Boolean(ragEnabled && emailEnabled));
      } catch (error) {
        console.error('Failed to check feature flags:', error);
      }
    };

    checkFeatures();
  }, []);

  if (!featuresEnabled) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2">Analyzing email...</span>
          </div>
        ) : (
          <>
            {/* Summary */}
            {summary && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Draft Reply */}
            {draftReply && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-4 w-4" />
                  <span className="font-medium">AI Draft Reply</span>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">{draftReply}</pre>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={generateDraftReply}
              disabled={generatingDraft}
              className="w-full"
            >
              {generatingDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Reply Draft
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}