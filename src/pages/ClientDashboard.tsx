/**
 * Client Dashboard - Main entry point
 *
 * ============================================================================
 * LOVABLE: DO NOT MODIFY TYPESCRIPT IN THIS FILE
 * ============================================================================
 * This project uses strict: false intentionally. TypeCheck passes (0 errors).
 * Do not apply stricter rules than tsconfig.json specifies.
 * ============================================================================
 */
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { DashboardSkeletons } from '@/components/dashboard/DashboardSkeletons';
import SwipeNavigator from '@/components/layout/SwipeNavigator';

// Lazy load dashboard components for better performance
const NewDashboard = lazy(() => import('@/components/dashboard/NewDashboard').then(module => ({ default: module.NewDashboard })));

const ClientDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { error, lastUpdated, refresh } = useDashboardData();
  const { dashboardLayout } = useUserPreferencesStore();

  return (
    <main className="dashboard-shell min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your AI receptionist is working hard for you today
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-800 dark:text-yellow-400" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-800 dark:text-yellow-300">{error}</span>
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                className="ml-4 h-auto px-3 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

      </div>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('welcome.subtitle')}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-800 dark:text-yellow-400" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-yellow-800 dark:text-yellow-300">{error}</span>
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  className="ml-4 h-auto px-3 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('actions.try_again')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="text-xs text-muted-foreground mb-6 text-center">
              {lastUpdated}
            </div>
          )}

          {/* Dashboard with lazy loading and comprehensive skeleton fallback */}
          <Suspense fallback={<DashboardSkeletons layout={dashboardLayout || 'comfortable'} />}>
            <NewDashboard />
          </Suspense>
        </div>

      <Footer />
    </main>
  );
};

export default ClientDashboard;
