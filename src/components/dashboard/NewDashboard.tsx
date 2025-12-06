/**
 * Enhanced Dashboard with Personalization
 *
 * Features:
 * - Welcome dialog for first-time users
 * - Personalized tips and recommendations
 * - Customizable layout based on user preferences
 * - Integration with user preferences store
 * - Enhanced error handling and loading states
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NextActionsSection } from './new/NextActionsSection';
import { WinsSection } from './new/WinsSection';
import { QuickActionsCard } from './QuickActionsCard';
import { ServiceHealth } from './ServiceHealth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KpiCard } from './components/KpiCard';
import { Calendar, DollarSign, Phone, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { PersonalizedWelcomeDialog } from './PersonalizedWelcomeDialog';
import { PersonalizedTips } from './PersonalizedTips';
import { WelcomeHeader } from './new/WelcomeHeader';

export const NewDashboard = () => {
  const { kpis, nextItems, transcripts, isLoading, hasData } = useDashboardData();
  const {
    hasCompletedOnboarding,
    dashboardLayout,
    showQuickActions,
    showServiceHealth,
    showRecentActivity,
  } = useUserPreferencesStore();
  const { isWelcomeDialogOpen, setWelcomeDialogOpen } = useDashboardStore();

  // Show welcome dialog for first-time users
  useEffect(() => {
    if (!hasCompletedOnboarding && !isWelcomeDialogOpen) {
      setWelcomeDialogOpen(true);
    }
  }, [hasCompletedOnboarding, isWelcomeDialogOpen, setWelcomeDialogOpen]);

  const getKpiConfig = (id: string) => {
    const configs = {
      bookings: {
        title: 'Bookings this week',
        subtitle: 'New appointments scheduled',
        icon: Calendar,
        color: 'text-info dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        ariaLabel: 'Weekly bookings performance'
      },
      payout: {
        title: 'Expected payout',
        subtitle: 'Revenue from active calls',
        icon: DollarSign,
        color: 'text-success dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        ariaLabel: 'Expected revenue payout'
      },
      answerRate: {
        title: 'Calls we caught',
        subtitle: 'Answer rate this period',
        icon: Phone,
        color: 'text-neutral dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        ariaLabel: 'Call answer rate performance'
      },
      rescued: {
        title: 'Missed but saved',
        subtitle: 'Calls recovered by AI',
        icon: Shield,
        color: 'text-brand-primary dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        ariaLabel: 'Calls rescued from being missed'
      }
    };
    return configs[id] || configs.bookings;
  };

  // Calculate spacing based on layout preference
  const spacingClass = dashboardLayout === 'compact' ? 'space-y-4' : dashboardLayout === 'spacious' ? 'space-y-8' : 'space-y-6';
  const gridGapClass = dashboardLayout === 'compact' ? 'gap-3' : dashboardLayout === 'spacious' ? 'gap-6' : 'gap-4';

  return (
    <>
      <div className={spacingClass}>
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* KPI Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-4 ${gridGapClass}`}>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : hasData ? (
          // Real KPI data
          kpis.map((kpi) => {
            const config = getKpiConfig(kpi.id);
            return (
              <KpiCard
                key={kpi.id}
                kpi={kpi}
                {...config}
                trend={kpi.deltaPct ? (kpi.deltaPct > 0 ? `+${kpi.deltaPct}%` : `${kpi.deltaPct}%`) : undefined}
              />
            );
          })
        ) : (
          // Empty state - No data yet
          Array.from({ length: 4 }).map((_, i) => {
            const configs = [
              { title: 'Bookings this week', subtitle: 'No appointments yet this week' },
              { title: 'Expected payout', subtitle: 'Revenue will calculate from calls' },
              { title: 'Calls we caught', subtitle: 'No calls received yet' },
              { title: 'Missed but saved', subtitle: 'No recovered calls yet' }
            ];
            return (
              <Card key={i} className="relative overflow-hidden border-0 opacity-70 hover:opacity-90 transition-opacity">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-muted-foreground dark:text-foreground/60">0</div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-foreground/80">{configs[i].title}</p>
                    <p className="text-xs text-muted-foreground/70 dark:text-foreground/70">{configs[i].subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 ${gridGapClass}`}>
          <div className={`lg:col-span-2 ${spacingClass}`}>
            <NextActionsSection nextItems={nextItems} isLoading={isLoading} />

            {showRecentActivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : hasData && transcripts.length > 0 ? (
                    <div className="space-y-3">
                      {transcripts.map((transcript) => (
                        <div key={transcript.id} className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer">
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{transcript.caller}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(transcript.atISO).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{transcript.summary}</p>
                            {transcript.needsReply && (
                              <div className="text-xs text-brand-primary dark:text-orange-400 font-medium">
                                Needs reply
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <div className="inline-flex p-3 rounded-full bg-muted/50 mb-2">
                        <Phone className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">No activity yet</p>
                      <p className="text-sm text-muted-foreground">Your dashboard will populate once calls start coming in</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className={spacingClass}>
            <WinsSection />

            {/* Personalized Tips */}
            <PersonalizedTips
              kpisData={kpis}
              nextItemsCount={nextItems?.length || 0}
              transcriptsCount={transcripts?.length || 0}
            />

            {showQuickActions && <QuickActionsCard />}
            {showServiceHealth && <ServiceHealth />}
          </div>
        </div>
      </div>

      {/* Welcome Dialog for First-Time Users */}
      <PersonalizedWelcomeDialog
        open={isWelcomeDialogOpen}
        onOpenChange={setWelcomeDialogOpen}
      />
    </>
  );
};
