/**
 * Dashboard Skeleton Loaders
 *
 * Provides loading state UI that matches the actual dashboard layout
 * Improves perceived performance and prevents layout shift
 *
 * Created as part of Phase 6: UI/UX Audit improvements
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonsProps {
  /**
   * Dashboard layout style from user preferences
   * @default 'comfortable'
   */
  layout?: 'compact' | 'comfortable' | 'spacious';
}

export const DashboardSkeletons: React.FC<DashboardSkeletonsProps> = ({ layout = 'comfortable' }) => {
  // Calculate spacing based on layout preference
  const spacingClass = layout === 'compact' ? 'space-y-4' : layout === 'spacious' ? 'space-y-8' : 'space-y-6';
  const gridGapClass = layout === 'compact' ? 'gap-3' : layout === 'spacious' ? 'gap-6' : 'gap-4';

  return (
    <div className={spacingClass}>
      {/* Welcome Header Skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* KPI Cards Skeleton - 4 cards in responsive grid */}
      <div className={`grid grid-cols-2 md:grid-cols-4 ${gridGapClass}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 ${gridGapClass}`}>
        {/* Left Column - Next Actions & Wins */}
        <div className={`lg:col-span-2 ${spacingClass}`}>
          {/* Next Actions Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wins Section Skeleton */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/20">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 pb-4 border-b last:border-0">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="flex items-center gap-2 mt-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Service Health */}
        <div className={spacingClass}>
          {/* Quick Actions Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Health Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personalized Tips Card */}
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-8 w-28 rounded-md mt-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading Indicator with Estimated Time */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading your dashboard...
          </span>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">
          This usually takes a few seconds
        </p>
      </div>
    </div>
  );
};

/**
 * Minimal skeleton for faster initial render
 * Use this when you need a very quick loading state
 */
export const DashboardSkeletonsMinimal: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-10 w-10 rounded-md mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    </div>
  );
};
