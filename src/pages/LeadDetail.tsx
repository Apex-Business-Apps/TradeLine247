import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadTimeline } from '@/components/Lead/LeadTimeline';
import { ArrowLeft, Mail, Phone, MessageSquare, Edit, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  score: number;
  preferred_contact?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  trade_in?: any;
  notes?: string;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      });
      navigate('/leads');
      return;
    }

    setLead(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-green-500',
      negotiating: 'bg-orange-500',
      won: 'bg-emerald-500',
      lost: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || !lead) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {lead.first_name} {lead.last_name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Lead created {format(new Date(lead.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Summary Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <Badge className={getScoreColor(lead.score)}>
                    {lead.score}/100
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="text-sm font-medium">{lead.source}</span>
                </div>

                <div className="pt-4 border-t space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.preferred_contact && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Prefers: {lead.preferred_contact}
                      </span>
                    </div>
                  )}
                </div>

                {lead.metadata && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Vehicle Interest</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {lead.metadata.timeline && (
                        <div>Timeline: {lead.metadata.timeline}</div>
                      )}
                      {lead.metadata.budget && (
                        <div>Budget: {lead.metadata.budget}</div>
                      )}
                      {lead.metadata.vehicle_interest && (
                        <div>Interest: {lead.metadata.vehicle_interest}</div>
                      )}
                    </div>
                  </div>
                )}

                {lead.trade_in && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Trade-In</h4>
                    <p className="text-sm text-muted-foreground">
                      {lead.trade_in.details || 'Has trade-in'}
                    </p>
                  </div>
                )}

                {lead.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Lead
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Timeline and Activity */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
                <TabsTrigger value="credit">Credit Apps</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                <LeadTimeline leadId={id!} />
              </TabsContent>

              <TabsContent value="quotes">
                <Card>
                  <CardHeader>
                    <CardTitle>Quotes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      No quotes yet. Create a quote for this lead.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credit">
                <Card>
                  <CardHeader>
                    <CardTitle>Credit Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      No credit applications yet.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
