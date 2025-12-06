/**
 * Dashboard Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../dashboardStore';

describe('dashboardStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useDashboardStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have default values', () => {
      const state = useDashboardStore.getState();
      
      expect(state.isWelcomeDialogOpen).toBe(false);
      expect(state.isSettingsDialogOpen).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.selectedKpiId).toBeNull();
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.notificationCount).toBe(0);
    });
  });

  describe('dialog states', () => {
    it('should set welcome dialog open', () => {
      useDashboardStore.getState().setWelcomeDialogOpen(true);
      
      expect(useDashboardStore.getState().isWelcomeDialogOpen).toBe(true);
    });

    it('should set settings dialog open', () => {
      useDashboardStore.getState().setSettingsDialogOpen(true);
      
      expect(useDashboardStore.getState().isSettingsDialogOpen).toBe(true);
    });

    it('should set quick action dialog with action', () => {
      useDashboardStore.getState().setQuickActionDialog(true, 'create-campaign');
      
      const state = useDashboardStore.getState();
      expect(state.isQuickActionDialogOpen).toBe(true);
      expect(state.selectedQuickAction).toBe('create-campaign');
    });

    it('should close quick action dialog and clear action', () => {
      useDashboardStore.getState().setQuickActionDialog(true, 'create-campaign');
      useDashboardStore.getState().setQuickActionDialog(false);
      
      const state = useDashboardStore.getState();
      expect(state.isQuickActionDialogOpen).toBe(false);
      expect(state.selectedQuickAction).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should set refreshing state', () => {
      useDashboardStore.getState().setRefreshing(true);
      
      expect(useDashboardStore.getState().isRefreshing).toBe(true);
    });

    it('should set syncing state', () => {
      useDashboardStore.getState().setSyncing(true);
      
      expect(useDashboardStore.getState().isSyncing).toBe(true);
    });
  });

  describe('selected items', () => {
    it('should set selected KPI', () => {
      useDashboardStore.getState().setSelectedKpi('kpi-123');
      
      expect(useDashboardStore.getState().selectedKpiId).toBe('kpi-123');
    });

    it('should clear selected KPI', () => {
      useDashboardStore.getState().setSelectedKpi('kpi-123');
      useDashboardStore.getState().setSelectedKpi(null);
      
      expect(useDashboardStore.getState().selectedKpiId).toBeNull();
    });

    it('should set selected transcript', () => {
      useDashboardStore.getState().setSelectedTranscript('transcript-456');
      
      expect(useDashboardStore.getState().selectedTranscriptId).toBe('transcript-456');
    });
  });

  describe('sidebar', () => {
    it('should toggle sidebar', () => {
      const initial = useDashboardStore.getState().sidebarCollapsed;
      
      useDashboardStore.getState().toggleSidebar();
      
      expect(useDashboardStore.getState().sidebarCollapsed).toBe(!initial);
    });

    it('should toggle sidebar multiple times', () => {
      useDashboardStore.getState().toggleSidebar();
      useDashboardStore.getState().toggleSidebar();
      
      expect(useDashboardStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('notifications', () => {
    it('should show notifications', () => {
      useDashboardStore.getState().setShowNotifications(true);
      
      expect(useDashboardStore.getState().showNotifications).toBe(true);
    });

    it('should clear notification count when showing notifications', () => {
      useDashboardStore.getState().incrementNotificationCount();
      useDashboardStore.getState().incrementNotificationCount();
      
      expect(useDashboardStore.getState().notificationCount).toBe(2);
      
      useDashboardStore.getState().setShowNotifications(true);
      
      expect(useDashboardStore.getState().notificationCount).toBe(0);
    });

    it('should increment notification count', () => {
      useDashboardStore.getState().incrementNotificationCount();
      useDashboardStore.getState().incrementNotificationCount();
      
      expect(useDashboardStore.getState().notificationCount).toBe(2);
    });

    it('should clear notification count', () => {
      useDashboardStore.getState().incrementNotificationCount();
      useDashboardStore.getState().clearNotificationCount();
      
      expect(useDashboardStore.getState().notificationCount).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Change multiple values
      useDashboardStore.getState().setWelcomeDialogOpen(true);
      useDashboardStore.getState().setSelectedKpi('kpi-123');
      useDashboardStore.getState().incrementNotificationCount();
      useDashboardStore.getState().toggleSidebar();
      
      // Reset
      useDashboardStore.getState().reset();
      
      const state = useDashboardStore.getState();
      expect(state.isWelcomeDialogOpen).toBe(false);
      expect(state.selectedKpiId).toBeNull();
      expect(state.notificationCount).toBe(0);
      expect(state.sidebarCollapsed).toBe(false);
    });
  });
});


