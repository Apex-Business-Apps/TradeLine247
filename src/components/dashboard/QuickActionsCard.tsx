import React, { useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, PhoneCall, Link as LinkIcon, Loader2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
  const isInRouter = useInRouterContext();

  const handleActionClick = async (action: typeof actions[0]) => {
    try {
      setClickedAction(action.label);
      
      // Log action click for debugging
      logger.debug('[QuickActions] Action clicked', {
        label: action.label,
        path: action.to,
        timestamp: new Date().toISOString()
      });

      // Navigate with error handling
      await goToWithFeedback(action.to, action.label);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[QuickActions] Navigation failed', error instanceof Error ? error : new Error(errorMessage), {
        action: action.label,
        path: action.to
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActionLoading = isNavigating && clickedAction === action.label;
          const testId = `quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`;
          const className = `w-full justify-start gap-2 relative ${
            isNavigating ? 'pointer-events-none opacity-70' : ''
          }`;

          return (
            <Button
              key={action.label}
              variant={action.variant}
              asChild={isInRouter}
              className={className}
              title={action.description}
              onClick={
                isInRouter
                  ? undefined
                  : () => {
                      void handleActionClick(action);
                    }
              }
              disabled={!isInRouter && isNavigating}
              aria-label={isInRouter ? undefined : `${action.label}: ${action.description}`}
              data-testid={isInRouter ? undefined : testId}
              data-qa-action={isInRouter ? undefined : action.label}
            >
              {isInRouter ? (
                <Link
                  to={action.to}
                  role="button"
                  onClick={(event) => {
                    if (isNavigating) {
                      event.preventDefault();
                      return;
                    }
                    setClickedAction(action.label);
                  }}
                  aria-label={`${action.label}: ${action.description}`}
                  aria-disabled={isNavigating}
                  data-testid={testId}
                  data-qa-action={action.label}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{action.label}</span>
                </Link>
              ) : (
                <>
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{action.label}</span>
                </>
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
