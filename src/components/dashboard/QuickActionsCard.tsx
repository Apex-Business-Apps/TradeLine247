import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, PhoneCall, Link as LinkIcon, Loader2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { toast } from 'sonner';
import { errorReporter } from '@/lib/errorReporter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type QuickActionKey = 'viewCalls' | 'addNumber' | 'inviteStaff' | 'integrations';

const actionConfig: Record<QuickActionKey, { icon: typeof Phone; to: string; variant: 'default' | 'outline' }> = {
  viewCalls: { icon: Phone, to: paths.calls, variant: 'default' },
  addNumber: { icon: PhoneCall, to: paths.addNumber, variant: 'outline' },
  inviteStaff: { icon: UserPlus, to: paths.teamInvite, variant: 'outline' },
  integrations: { icon: LinkIcon, to: paths.integrations, variant: 'outline' },
};

interface QuickActionsCardProps {
  className?: string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ className }) => {
  const { goToWithFeedback, isNavigating } = useSafeNavigation();
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const { t } = useTranslation('common');

  const actions = useMemo(() => {
    return (Object.keys(actionConfig) as QuickActionKey[]).map((key) => {
      const config = actionConfig[key];
      return {
        key,
        label: t(`quickActions.actions.${key}.label`),
        description: t(`quickActions.actions.${key}.description`),
        ...config,
      };
    });
  }, [t]);

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
    <Card className={cn('quick-actions-card relative z-[2]', className)} style={{ zIndex: 2 }}>
      <CardHeader>
        <CardTitle className="text-lg">{t('quickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActionLoading = isNavigating && clickedAction === action.label;
          const descriptionId = `quick-action-${action.key}-description`;

          return (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={() => handleActionClick(action)}
              disabled={isNavigating}
              className="w-full justify-start gap-2 relative"
              aria-label={action.label}
              aria-describedby={descriptionId}
              title={action.description}
              data-testid={`quick-action-${action.key}`}
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
