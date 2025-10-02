import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROICalculator } from '@/components/Growth/ROICalculator';
import { ViralWidget } from '@/components/Growth/ViralWidget';
import { ReferralProgram } from '@/components/Growth/ReferralProgram';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Gift, Code, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Growth = () => {
  const [userData, setUserData] = useState<any>(null);
  const [referralStats, setReferralStats] = useState({ count: 0, credits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: referrals, count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact' })
        .eq('referrer_id', user.id)
        .eq('status', 'converted');

      setUserData(profile);
      setReferralStats({
        count: count || 0,
        credits: (profile?.referral_credits || 0)
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                Growth Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Tools to help you grow and maximize your dealership's potential
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              {referralStats.credits} Credits
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="roi" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="roi" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              ROI Calculator
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-2">
              <Gift className="w-4 h-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="widget" className="gap-2">
              <Code className="w-4 h-4" />
              Widget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roi" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Calculate Your Potential ROI</CardTitle>
                <CardDescription>
                  See how much revenue AutoRepAi can add to your dealership
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ROICalculator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral" className="space-y-6">
            <ReferralProgram
              userId={userData?.id}
              referralCode={userData?.referral_code}
              referralCount={referralStats.count}
              referralCredits={referralStats.credits}
            />
          </TabsContent>

          <TabsContent value="widget" className="space-y-6">
            <ViralWidget
              dealershipId={userData?.dealership_id}
              dealershipName="Your Dealership"
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Why Add the Widget?</CardTitle>
                <CardDescription>
                  Benefits of displaying the AutoRepAi badge on your site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2">Build Trust</h3>
                    <p className="text-sm text-muted-foreground">
                      Show visitors you use modern, AI-powered technology
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2">Earn Credits</h3>
                    <p className="text-sm text-muted-foreground">
                      Get 1 month free for every dealership that signs up
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2">Track Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      See impressions, clicks, and conversions in real-time
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2">No Branding Impact</h3>
                    <p className="text-sm text-muted-foreground">
                      Small, subtle badge that doesn't interfere with your brand
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Growth;
