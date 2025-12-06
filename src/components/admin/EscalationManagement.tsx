import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  User,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Escalation {
  id: string;
  organization_id: string;
  call_sid: string | null;
  booking_id: string | null;
  escalation_type: 'emergency' | 'complex_business' | 'technical_issue' | 'policy_violation';
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  trigger_reason: string;
  transcript_snippet: string | null;
  ai_analysis: any;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface EscalationDetails extends Escalation {
  caller_info?: {
    name: string;
    phone: string;
    email: string;
  };
  booking_info?: {
    reference: string;
    service_type: string;
    status: string;
  };
}

const ESCALATION_TYPES = {
  emergency: {
    label: 'Emergency',
    color: 'destructive' as const,
    icon: AlertTriangle,
    description: 'Medical, legal, or immediate safety concerns'
  },
  complex_business: {
    label: 'Complex Business',
    color: 'secondary' as const,
    icon: MessageSquare,
    description: 'High-value opportunities or complex negotiations'
  },
  technical_issue: {
    label: 'Technical Issue',
    color: 'default' as const,
    icon: RefreshCw,
    description: 'System problems or technical difficulties'
  },
  policy_violation: {
    label: 'Policy Violation',
    color: 'destructive' as const,
    icon: Shield,
    description: 'Inappropriate content or policy breaches'
  }
};

const SEVERITY_LEVELS = {
  low: { label: 'Low', color: 'secondary' as const },
  medium: { label: 'Medium', color: 'default' as const },
  high: { label: 'High', color: 'destructive' as const },
  critical: { label: 'Critical', color: 'destructive' as const }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'secondary' as const, icon: Clock },
  in_progress: { label: 'In Progress', color: 'default' as const, icon: RefreshCw },
  resolved: { label: 'Resolved', color: 'default' as const, icon: CheckCircle },
  escalated: { label: 'Escalated', color: 'destructive' as const, icon: AlertTriangle }
};

export function EscalationManagement() {
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationDetails | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch escalations
  const { data: escalations, isLoading } = useQuery({
    queryKey: ['escalations'],
    queryFn: async (): Promise<Escalation[]> => {
      const { data, error } = await supabase
        .from('escalation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Resolve escalation mutation
  const resolveEscalationMutation = useMutation({
    mutationFn: async ({ escalationId, status, notes }: {
      escalationId: string;
      status: string;
      notes: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('resolve-escalation', {
        body: { escalationId, status, notes },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Escalation updated successfully');
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      setSelectedEscalation(null);
      setResolutionNotes('');
      setNewStatus('');
    },
    onError: (error) => {
      toast.error('Failed to update escalation');
      console.error('Escalation update error:', error);
    },
  });

  // Group escalations by status
  const groupedEscalations = React.useMemo(() => {
    if (!escalations) return {};

    return escalations.reduce((acc, escalation) => {
      const status = escalation.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(escalation);
      return acc;
    }, {} as Record<string, Escalation[]>);
  }, [escalations]);

  // Get escalation details with additional context
  const getEscalationDetails = async (escalation: Escalation): Promise<EscalationDetails> => {
    const details: EscalationDetails = { ...escalation };

    // Get caller info from call logs if available
    if (escalation.call_sid) {
      const { data: callLog } = await supabase
        .from('call_logs')
        .select('from_e164, transcript')
        .eq('call_sid', escalation.call_sid)
        .single();

      if (callLog) {
        // Extract caller info from transcript (simplified)
        const transcript = callLog.transcript || '';
        const nameMatch = transcript.match(/my name is ([^,.]+)/i) || transcript.match(/I'm ([^,.]+)/i);
        const emailMatch = transcript.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

        details.caller_info = {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          phone: callLog.from_e164,
          email: emailMatch ? emailMatch[1] : 'Not provided'
        };
      }
    }

    // Get booking info if available
    if (escalation.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('booking_reference, service_type, status')
        .eq('id', escalation.booking_id)
        .single();

      if (booking) {
        details.booking_info = {
          reference: booking.booking_reference,
          service_type: booking.service_type,
          status: booking.status
        };
      }
    }

    return details;
  };

  const handleViewEscalation = async (escalation: Escalation) => {
    const details = await getEscalationDetails(escalation);
    setSelectedEscalation(details);
  };

  const handleResolveEscalation = () => {
    if (!selectedEscalation || !newStatus) return;

    resolveEscalationMutation.mutate({
      escalationId: selectedEscalation.id,
      status: newStatus,
      notes: resolutionNotes,
    });
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, in_progress: 0, resolved: 0, escalated: 0 };
    escalations?.forEach(e => {
      counts[e.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading escalations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Escalation Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage AI escalations requiring human intervention
          </p>
        </div>

        <div className="flex gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} variant={STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color}>
              {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}: {count}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            In Progress ({statusCounts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved ({statusCounts.resolved})
          </TabsTrigger>
          <TabsTrigger value="escalated" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Escalated ({statusCounts.escalated})
          </TabsTrigger>
        </TabsList>

        {Object.entries(STATUS_CONFIG).map(([statusKey, statusConfig]) => (
          <TabsContent key={statusKey} value={statusKey}>
            <div className="space-y-4">
              {groupedEscalations[statusKey]?.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <statusConfig.icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No {statusConfig.label.toLowerCase()} escalations</h3>
                    <p className="text-muted-foreground">
                      {statusKey === 'pending'
                        ? 'All escalations have been addressed.'
                        : `No escalations are currently ${statusConfig.label.toLowerCase()}.`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupedEscalations[statusKey]?.map((escalation) => {
                  const typeConfig = ESCALATION_TYPES[escalation.escalation_type];
                  const severityConfig = SEVERITY_LEVELS[escalation.severity_level];

                  return (
                    <Card key={escalation.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <typeConfig.icon className={`w-5 h-5 text-${typeConfig.color}-500`} />
                            <div>
                              <CardTitle className="text-base">
                                {typeConfig.label} Escalation
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(escalation.created_at), 'MMM dd, yyyy hh:mm a')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={severityConfig.color}>
                              {severityConfig.label}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEscalation(escalation)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm mb-3">{escalation.trigger_reason}</p>

                        {escalation.transcript_snippet && (
                          <div className="bg-muted/50 p-3 rounded-md mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Transcript Snippet:</p>
                            <p className="text-sm italic">"{escalation.transcript_snippet}"</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {escalation.call_sid && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Call: {escalation.call_sid.slice(-8)}
                            </span>
                          )}
                          {escalation.booking_id && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Booking: {escalation.booking_id.slice(-8)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Escalation Details Dialog */}
      <Dialog open={!!selectedEscalation} onOpenChange={() => setSelectedEscalation(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEscalation && (
                <>
                  {React.createElement(
                    ESCALATION_TYPES[selectedEscalation.escalation_type].icon,
                    { className: 'w-5 h-5' }
                  )}
                  {ESCALATION_TYPES[selectedEscalation.escalation_type].label} Escalation
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEscalation && (
            <div className="space-y-6">
              {/* Escalation Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{ESCALATION_TYPES[selectedEscalation.escalation_type].label}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge variant={SEVERITY_LEVELS[selectedEscalation.severity_level].color}>
                    {SEVERITY_LEVELS[selectedEscalation.severity_level].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={STATUS_CONFIG[selectedEscalation.status].color}>
                    {STATUS_CONFIG[selectedEscalation.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{format(new Date(selectedEscalation.created_at), 'MMM dd, yyyy hh:mm a')}</p>
                </div>
              </div>

              {/* Trigger Reason */}
              <div>
                <Label className="text-sm font-medium">Trigger Reason</Label>
                <p className="text-sm mt-1">{selectedEscalation.trigger_reason}</p>
              </div>

              {/* Caller Information */}
              {selectedEscalation.caller_info && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Caller Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <p>{selectedEscalation.caller_info.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <p>{selectedEscalation.caller_info.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Email</Label>
                        <p>{selectedEscalation.caller_info.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Information */}
              {selectedEscalation.booking_info && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Booking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs">Reference</Label>
                        <p className="font-mono">{selectedEscalation.booking_info.reference}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Service</Label>
                        <p>{selectedEscalation.booking_info.service_type}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Status</Label>
                        <Badge variant="outline">{selectedEscalation.booking_info.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transcript Snippet */}
              {selectedEscalation.transcript_snippet && (
                <div>
                  <Label className="text-sm font-medium">Transcript Snippet</Label>
                  <div className="bg-muted/50 p-3 rounded-md mt-1">
                    <p className="text-sm italic">"{selectedEscalation.transcript_snippet}"</p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {selectedEscalation.ai_analysis && (
                <div>
                  <Label className="text-sm font-medium">AI Analysis</Label>
                  <div className="bg-muted/50 p-3 rounded-md mt-1">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedEscalation.ai_analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Resolution Section (for pending/in_progress) */}
              {(selectedEscalation.status === 'pending' || selectedEscalation.status === 'in_progress') && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="status">Update Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">Mark as In Progress</SelectItem>
                          <SelectItem value="resolved">Mark as Resolved</SelectItem>
                          <SelectItem value="escalated">Escalate Further</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Resolution Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Describe how this escalation was handled..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleResolveEscalation}
                      disabled={!newStatus || resolveEscalationMutation.isPending}
                      className="w-full"
                    >
                      {resolveEscalationMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Escalation'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Resolution History */}
              {selectedEscalation.status !== 'pending' && selectedEscalation.resolution_notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resolution Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Final Status</Label>
                        <Badge variant={STATUS_CONFIG[selectedEscalation.status].color} className="ml-2">
                          {STATUS_CONFIG[selectedEscalation.status].label}
                        </Badge>
                      </div>

                      {selectedEscalation.resolved_at && (
                        <div>
                          <Label className="text-xs">Resolved At</Label>
                          <p className="text-sm">{format(new Date(selectedEscalation.resolved_at), 'MMM dd, yyyy hh:mm a')}</p>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs">Resolution Notes</Label>
                        <p className="text-sm mt-1">{selectedEscalation.resolution_notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}