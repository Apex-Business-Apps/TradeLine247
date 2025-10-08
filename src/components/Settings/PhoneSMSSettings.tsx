import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageSquare, CheckCircle, XCircle } from "lucide-react";

export default function PhoneSMSSettings() {
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'checking' | 'verified' | 'error'>('checking');

  const handleTestSMS = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing fields",
        description: "Please enter a phone number and message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: testPhone, body: testMessage },
      });

      if (error) throw error;

      toast({
        title: "SMS sent",
        description: `Message sent successfully to ${testPhone}`,
      });
      setTestMessage("");
    } catch (error: any) {
      toast({
        title: "SMS failed",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestCall = async () => {
    toast({
      title: "Test call",
      description: "Call your Twilio number to test inbound call forwarding",
    });
  };

  const checkWebhooks = async () => {
    setWebhookStatus('checking');
    try {
      // Check recent call logs
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setWebhookStatus(data && data.length > 0 ? 'verified' : 'error');
    } catch (error) {
      setWebhookStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice & Call Forwarding
          </CardTitle>
          <CardDescription>
            Configure inbound call handling and forwarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Webhook Status</p>
              <p className="text-sm text-muted-foreground">
                Voice webhook configuration
              </p>
            </div>
            <div className="flex items-center gap-2">
              {webhookStatus === 'verified' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {webhookStatus === 'error' && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Button onClick={checkWebhooks} variant="outline" size="sm">
                {webhookStatus === 'checking' ? 'Checking...' : 'Verify'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              readOnly
              value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-voice`}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Configure this URL in your Twilio phone number settings
            </p>
          </div>

          <Button onClick={handleTestCall} variant="outline" className="w-full">
            <Phone className="mr-2 h-4 w-4" />
            Test Inbound Call
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Messaging
          </CardTitle>
          <CardDescription>
            Send test messages and configure SMS webhooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SMS Webhook URL</Label>
            <Input
              readOnly
              value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-sms`}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Configure this URL in your Twilio phone number settings
            </p>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Send Test SMS</h4>
            <div className="space-y-2">
              <Label htmlFor="testPhone">Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+1234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testMessage">Message</Label>
              <Textarea
                id="testMessage"
                placeholder="Enter test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleTestSMS}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? "Sending..." : "Send Test SMS"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}