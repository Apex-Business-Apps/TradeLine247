import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewDashboard } from '../NewDashboard';

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    kpis: [],
    nextItems: [],
    transcripts: [],
    isLoading: false,
    hasData: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/stores/userPreferencesStore', () => ({
  useUserPreferencesStore: () => ({
    hasCompletedOnboarding: true,
    dashboardLayout: 'comfortable',
    showQuickActions: true,
    showServiceHealth: true,
    showRecentActivity: false,
    showWelcomeMessage: false,
  }),
}));

vi.mock('@/stores/dashboardStore', () => ({
  useDashboardStore: () => ({
    isWelcomeDialogOpen: false,
    setWelcomeDialogOpen: vi.fn(),
  }),
}));

vi.mock('../new/NextActionsSection', () => ({ NextActionsSection: () => <div data-testid="next-actions" /> }));
vi.mock('../new/WinsSection', () => ({ WinsSection: () => <div data-testid="wins-section" /> }));
vi.mock('../QuickActionsCard', () => ({ QuickActionsCard: () => <div data-testid="quick-actions" /> }));
vi.mock('../ServiceHealth', () => ({ ServiceHealth: () => <div data-testid="service-health" /> }));
vi.mock('../PersonalizedTips', () => ({ PersonalizedTips: () => <div data-testid="personalized-tips" /> }));
vi.mock('../PersonalizedWelcomeDialog', () => ({ PersonalizedWelcomeDialog: () => null }));
vi.mock('../components/KpiCard', () => ({ KpiCard: ({ kpi }: { kpi: { id: string } }) => <div data-testid={`kpi-${kpi.id}`} /> }));

describe('NewDashboard layout', () => {
  it('does not render the greeting strip inside the dashboard content', () => {
    render(<NewDashboard />);

    expect(screen.queryByTestId('welcome-header')).not.toBeInTheDocument();
  });
});
