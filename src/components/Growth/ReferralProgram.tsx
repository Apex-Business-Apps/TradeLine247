import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Copy, Check, Mail, Share2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferralProgramProps {
  userId?: string;
  referralCode?: string;
  referralCount?: number;
  referralCredits?: number;
}

export const ReferralProgram = ({ 
  userId, 
  referralCode = 'DEMO123',
  referralCount = 0,
  referralCredits = 0 
}: ReferralProgramProps) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const referralUrl = `https://autorerai.ai/signup?ref=${referralCode}`;
  
  const shareLinks = {
    email: `mailto:?subject=Try AutoRepAi - Get 1 Month Free&body=I've been using AutoRepAi to automate my dealership leads and it's amazing! Sign up with my link and we both get 1 month free: ${referralUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=Just started using AutoRepAi to automate my dealership! Sign up with my link and get 1 month free: ${referralUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share it with other dealerships to earn rewards",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!email || !userId) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: userId,
          referred_email: email,
          referral_code: referralCode,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `We've sent an invitation to ${email}`,
      });
      setEmail('');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-primary">{referralCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Earned</p>
                <p className="text-3xl font-bold text-primary">{referralCredits}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Months Free</p>
                <p className="text-3xl font-bold text-primary">{Math.floor(referralCredits / 149)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Referral Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                Refer & Earn
              </CardTitle>
              <CardDescription className="mt-2">
                Give $149, Get $149 - Both you and your friend get 1 month free
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm px-3 py-1">
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Referral Link */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Your Referral Link
            </h3>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="default"
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Send Invite */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Send Invitation
            </h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@dealership.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendInvite}
                disabled={loading || !email}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Share on Social
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(shareLinks.email, '_blank')}
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(shareLinks.twitter, '_blank')}
              >
                <Share2 className="w-4 h-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(shareLinks.linkedin, '_blank')}
              >
                <Share2 className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(shareLinks.facebook, '_blank')}
              >
                <Share2 className="w-4 h-4" />
                Facebook
              </Button>
            </div>
          </div>

          {/* How it Works */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  1
                </div>
                <div>
                  <p className="font-medium">Share your unique link</p>
                  <p className="text-sm text-muted-foreground">Send to dealerships who could benefit from AutoRepAi</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  2
                </div>
                <div>
                  <p className="font-medium">They sign up and get 1 month free</p>
                  <p className="text-sm text-muted-foreground">Your friend gets $149 credit on their first month</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  3
                </div>
                <div>
                  <p className="font-medium">You both earn rewards</p>
                  <p className="text-sm text-muted-foreground">Get $149 credit for each paying customer you refer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Terms:</strong> Credits are applied after the referred customer completes 1 month of paid service. 
              Unlimited referrals. Credits can be used towards any AutoRepAi plan. No cash value.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
