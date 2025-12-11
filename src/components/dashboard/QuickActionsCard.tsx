import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, PhoneCall, Link as LinkIcon, Loader2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { toast } from 'sonner';
import { errorReporter } from '@/lib/errorReporter';
import { cn } from '@/lib/utils';

const actions = [
  {
    label: 'View Calls',
    icon: Phone,
    to: paths.calls,
    variant: 'default' as const,
    description: 'Review call history and activity'
  },
  {
    label: 'Add Number',
    icon: PhoneCall,
    to: paths.addNumber,
    variant: 'outline' as const,
    description: 'Purchase or provision a new phone number'
  },
  {
    label: 'Invite Staff',
    icon: UserPlus,
    to: paths.teamInvite,
    variant: 'outline' as const,
    description: 'Grant access to team members'
  },
  {
    label: 'Integrations',
    icon: LinkIcon,
    to: paths.integrations,
    variant: 'outline' as const,
    description: 'Connect external services'
  },
];

export const QuickActionsCard: React.FC = () => {
  const { goToWithFeedback, isNavigating } = useSafeNavigation();
  const [clickedAction, setClickedAction] = useState<string | null>(null);

  const handleActionClick = async (action: typeof actions[0]) => {
    try {
      setClickedAction(action.label);
      
      // Log action click for debugging
      if (import.meta.env.DEV) {
        console.log('[QuickActions] Action clicked:', {
          label: action.label,
          path: action.to,
          timestamp: new Date().toISOString()
        });
      }

      // Navigate with error handling
      await goToWithFeedback(action.to, action.label);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorReporter.report({
        type: 'error',
        message: `Quick action navigation failed: ${action.label} to ${action.to}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { action: action.label, path: action.to, error: errorMessage }
      });
      
      toast.error('Action Failed', {
        description: `Unable to ${action.label.toLowerCase()}. Please try again.`,
        duration: 4000
      });
    } finally {
      // Clear clicked state after a short delay
      setTimeout(() => setClickedAction(null), 500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActionLoading = isNavigating && clickedAction === action.label;
          const descriptionId = `quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}-description`;

          return (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={() => handleActionClick(action)}
              disabled={isNavigating}
              className={cn(
                "w-full justify-start gap-2 relative",
                action.variant === 'default' ? 'text-white' : undefined
              )}
              aria-label={action.label}
              aria-describedby={descriptionId}
              title={action.description}
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              data-qa-action={action.label}
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
              <Icon className="h-4 w-4" />
              )}
              <span className={isActionLoading ? 'opacity-70' : ''}>
              {action.label}
              </span>
              <span id={descriptionId} className="sr-only">
                {action.description}
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
