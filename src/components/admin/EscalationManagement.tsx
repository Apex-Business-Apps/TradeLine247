/**
 * Escalation Management Component
 *
 * Admin interface for managing escalated calls and issues
 * with resolution tracking and audit logging.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle,
  ArrowUpCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Escalation {
  id: string;
  callSid: string;
  callerName?: string;
  callerPhone?: string;
  escalationType: 'human_requested' | 'emergency' | 'complex_business' | 'sentiment_triggered';
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  triggerReason: string;
  transcriptSnippet: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

interface EscalationManagementProps {
  organizationId: string;
}

const SEVERITY_CONFIG = {
  low: { color: 'bg-blue-500', label: 'Low' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  critical: { color: 'bg-red-500', label: 'Critical' },
};

const TYPE_LABELS = {
  human_requested: 'Human Requested',
  emergency: 'Emergency',
  complex_business: 'Complex Issue',
  sentiment_triggered: 'Sentiment Triggered',
};

export function EscalationManagement({ organizationId }: EscalationManagementProps) {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [filteredEscalations, setFilteredEscalations] = useState<Escalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    resolution: 'resolved' as 'resolved' | 'escalated',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
  });

  useEffect(() => {
    fetchEscalations();
  }, [organizationId]);

  useEffect(() => {
    filterEscalations();
  }, [escalations, searchQuery, statusFilter, severityFilter]);

  const fetchEscalations = async () => {
    try {
      const response = await fetch(`/api/admin/escalations?organizationId=${organizationId}`);
      if (response.ok) {
        const { escalations: data } = await response.json();
        setEscalations(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch escalations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEscalations = () => {
    let filtered = [...escalations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.callerName?.toLowerCase().includes(query) ||
        e.callerPhone?.includes(query) ||
        e.triggerReason.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severityLevel === severityFilter);
    }

    setFilteredEscalations(filtered);
  };

  const handleResolve = async () => {
    if (!selectedEscalation) return;

    try {
      const response = await fetch('/api/resolve-escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalationId: selectedEscalation.id,
          resolution: resolutionData.resolution,
          resolutionNotes: resolutionData.notes,
          followUpRequired: resolutionData.followUpRequired,
          followUpDate: resolutionData.followUpDate || undefined,
        }),
      });

      if (response.ok) {
        setEscalations(prev => prev.map(e =>
          e.id === selectedEscalation.id
            ? { ...e, status: resolutionData.resolution, resolutionNotes: resolutionData.notes, resolvedAt: new Date().toISOString() }
            : e
        ));
        setIsResolveDialogOpen(false);
        setSelectedEscalation(null);
        setResolutionData({ resolution: 'resolved', notes: '', followUpRequired: false, followUpDate: '' });
      }
    } catch (error) {
      console.error('Failed to resolve escalation:', error);
    }
  };

  const openResolveDialog = (escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setIsResolveDialogOpen(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = escalations.filter(e => e.status === 'pending').length;
  const criticalCount = escalations.filter(e => e.severityLevel === 'critical' && e.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Escalations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {escalations.filter(e => e.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchEscalations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Escalation List */}
      <Card>
        <CardHeader>
          <CardTitle>Escalations</CardTitle>
          <CardDescription>
            {filteredEscalations.length} escalation{filteredEscalations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEscalations.length > 0 ? (
              filteredEscalations.map((escalation) => (
                <div
                  key={escalation.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4",
                    escalation.severityLevel === 'critical' && "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className={cn(
                    "mt-1 h-3 w-3 rounded-full",
                    SEVERITY_CONFIG[escalation.severityLevel].color
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {escalation.callerName || 'Unknown Caller'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[escalation.escalationType]}
                      </Badge>
                      <Badge
                        variant={escalation.status === 'resolved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {escalation.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {escalation.triggerReason}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {escalation.callerPhone || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(escalation.createdAt)}
                      </span>
                    </div>

                    {escalation.transcriptSnippet && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm italic">
                        "{escalation.transcriptSnippet.substring(0, 150)}..."
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {escalation.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => openResolveDialog(escalation)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No escalations found matching your filters
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Escalation</DialogTitle>
            <DialogDescription>
              Document the resolution for this escalation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Status</Label>
              <Select
                value={resolutionData.resolution}
                onValueChange={(v: 'resolved' | 'escalated') =>
                  setResolutionData(prev => ({ ...prev, resolution: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resolved
                    </div>
                  </SelectItem>
                  <SelectItem value="escalated">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                      Escalate Further
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe how the issue was resolved..."
                value={resolutionData.notes}
                onChange={(e) => setResolutionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="followup">Requires Follow-up</Label>
                <p className="text-xs text-muted-foreground">
                  Schedule a follow-up with the customer
                </p>
              </div>
              <Switch
                id="followup"
                checked={resolutionData.followUpRequired}
                onCheckedChange={(checked) =>
                  setResolutionData(prev => ({ ...prev, followUpRequired: checked }))
                }
              />
            </div>

            {resolutionData.followUpRequired && (
              <div className="space-y-2">
                <Label htmlFor="followupDate">Follow-up Date</Label>
                <Input
                  id="followupDate"
                  type="date"
                  value={resolutionData.followUpDate}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionData.notes.trim()}>
              Save Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EscalationManagement;
