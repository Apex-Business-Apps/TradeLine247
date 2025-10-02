import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ViralWidgetProps {
  dealershipId?: string;
  dealershipName?: string;
}

export const ViralWidget = ({ dealershipId = 'demo', dealershipName = 'Your Dealership' }: ViralWidgetProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate unique widget code for tracking
  const widgetCode = `ARai-${dealershipId}-${Date.now().toString(36)}`;
  
  const embedCode = `<!-- AutoRepAi Widget -->
<div id="autorerai-widget" data-code="${widgetCode}"></div>
<script>
(function(d,s,id){
  var js,fjs=d.getElementsByTagName(s)[0];
  if(d.getElementById(id))return;
  js=d.createElement(s);js.id=id;
  js.src='https://cdn.autorerai.ai/widget.js';
  js.setAttribute('data-dealership','${dealershipId}');
  fjs.parentNode.insertBefore(js,fjs);
}(document,'script','autorerai-wjs'));
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Widget code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Viral Growth Widget
            </CardTitle>
            <CardDescription className="mt-2">
              Add this widget to your website and get credited for every referral
            </CardDescription>
          </div>
          <Badge variant="default" className="text-sm px-3 py-1">
            Free Tier Bonus
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Preview */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Preview
          </h3>
          <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted/30 flex items-center justify-center">
            <WidgetPreview dealershipName={dealershipName} />
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">+1 Month</div>
            <p className="text-sm text-muted-foreground">Free per signup</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">Auto-Track</div>
            <p className="text-sm text-muted-foreground">All impressions & clicks</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">Analytics</div>
            <p className="text-sm text-muted-foreground">Real-time dashboard</p>
          </div>
        </div>

        {/* Embed Code */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Embed Code
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <pre className="p-4 rounded-lg bg-card border border-border overflow-x-auto text-xs font-mono">
              <code>{embedCode}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                HTML
              </Badge>
            </div>
          </div>
        </div>

        {/* Installation Steps */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Installation Steps
          </h3>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                1
              </span>
              <div>
                <p className="font-medium">Copy the embed code above</p>
                <p className="text-sm text-muted-foreground">Click the "Copy Code" button</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                2
              </span>
              <div>
                <p className="font-medium">Paste into your website footer</p>
                <p className="text-sm text-muted-foreground">Add it before the closing &lt;/body&gt; tag</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                3
              </span>
              <div>
                <p className="font-medium">Start earning referral credits</p>
                <p className="text-sm text-muted-foreground">Get 1 month free for every signup through your widget</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Widget Info */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Code className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Widget ID</p>
              <p className="text-xs text-muted-foreground font-mono">{widgetCode}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            View Stats
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Widget Preview Component
const WidgetPreview = ({ dealershipName }: { dealershipName: string }) => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm">
        <span className="text-muted-foreground">{dealershipName} uses</span>{' '}
        <span className="font-semibold text-primary group-hover:underline">AutoRepAi</span>
      </span>
      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  );
};
