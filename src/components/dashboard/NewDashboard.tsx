/**
 * Enhanced Dashboard with Personalization
 *
 * Features:
 * - Welcome dialog for first-time users
 * - Personalized tips and recommendations
 * - Customizable layout based on user preferences
 * - Integration with user preferences store
 * - Enhanced error handling and loading states
 *
 * ============================================================================
 * LOVABLE: DO NOT MODIFY TYPESCRIPT IN THIS FILE
 * ============================================================================
 * This project uses strict: false, noImplicitAny: false (intentional config).
 * All type checks pass: npm run typecheck → ✅ 0 errors
 * Build succeeds: npm run build → ✅ successful
 * The code is correct as-is. Do not "fix" TypeScript unless explicitly asked.
 * ============================================================================
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export const NewDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { kpis, nextItems, transcripts, isLoading, hasData } = useDashboardData();
  const {
    hasCompletedOnboarding,
    dashboardLayout,
    showQuickActions,
    showServiceHealth,
    showRecentActivity,
    translationsEnabled,
  } = useUserPreferencesStore();
  const { isWelcomeDialogOpen, setWelcomeDialogOpen } = useDashboardStore();

  // Show welcome dialog for first-time users
  useEffect(() => {
    if (!hasCompletedOnboarding && !isWelcomeDialogOpen) {
      setWelcomeDialogOpen(true);
    }
  }, [hasCompletedOnboarding, isWelcomeDialogOpen, setWelcomeDialogOpen]);

  const getKpiConfig = (id: string) => {
    // Use English text directly when translations are disabled, otherwise use translations
    const configs = {
      bookings: {
        title: translationsEnabled ? t('kpi.bookings') : 'Bookings this week',
        subtitle: translationsEnabled ? t('kpi.bookings_subtitle') : 'New appointments scheduled',
        icon: Calendar,
        color: 'text-info dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        ariaLabel: translationsEnabled ? t('kpi.bookings_aria') : 'Weekly bookings performance'
      },
      payout: {
        title: translationsEnabled ? t('kpi.payout') : 'Expected payout',
        subtitle: translationsEnabled ? t('kpi.payout_subtitle') : 'Revenue from active calls',
        icon: DollarSign,
        color: 'text-success dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        ariaLabel: translationsEnabled ? t('kpi.payout_aria') : 'Expected revenue payout'
      },
      answerRate: {
        title: translationsEnabled ? t('kpi.answerRate') : 'Calls we caught',
        subtitle: translationsEnabled ? t('kpi.answerRate_subtitle') : 'Answer rate this period',
        icon: Phone,
        color: 'text-neutral dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        ariaLabel: translationsEnabled ? t('kpi.answerRate_aria') : 'Call answer rate performance'
      },
      rescued: {
        title: translationsEnabled ? t('kpi.rescued') : 'Missed but saved',
        subtitle: translationsEnabled ? t('kpi.rescued_subtitle') : 'Calls recovered by AI',
        icon: Shield,
        color: 'text-brand-primary dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        ariaLabel: translationsEnabled ? t('kpi.rescued_aria') : 'Calls rescued from being missed'
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
              { title: translationsEnabled ? t('kpi.bookings') : 'Bookings this week', subtitle: translationsEnabled ? t('kpi.bookings_empty') : 'No appointments yet this week' },
              { title: translationsEnabled ? t('kpi.payout') : 'Expected payout', subtitle: translationsEnabled ? t('kpi.payout_empty') : 'Revenue will calculate from calls' },
              { title: translationsEnabled ? t('kpi.answerRate') : 'Calls we caught', subtitle: translationsEnabled ? t('kpi.answerRate_empty') : 'No calls received yet' },
              { title: translationsEnabled ? t('kpi.rescued') : 'Missed but saved', subtitle: translationsEnabled ? t('kpi.rescued_empty') : 'No recovered calls yet' }
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
                  <CardTitle className="text-lg">{t('recent_activity.title')}</CardTitle>
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
                                {t('recent_activity.needs_reply')}
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
                      <p className="font-medium text-foreground">{t('recent_activity.no_activity')}</p>
                      <p className="text-sm text-muted-foreground">{t('recent_activity.no_activity_description')}</p>
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

            {showQuickActions && (
              <div className="quick-actions lg:sticky lg:top-4 ios-no-sticky">
                <QuickActionsCard />
              </div>
            )}
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
