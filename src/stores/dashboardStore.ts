/**
 * Dashboard State Store
 *
 * Manages real-time dashboard state (session-based, not persisted).
 * Features:
 * - Dialog visibility states
 * - Loading states
 * - Selected items
 * - Temporary UI states
 */

import { create } from 'zustand';

interface DashboardStore {
  // Dialog states
  isWelcomeDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isQuickActionDialogOpen: boolean;
  selectedQuickAction: string | null;

  // Loading states
  isRefreshing: boolean;
  isSyncing: boolean;

  // Selected items
  selectedKpiId: string | null;
  selectedTranscriptId: string | null;

  // UI states
  sidebarCollapsed: boolean;
  showNotifications: boolean;
  notificationCount: number;

  // Actions
  setWelcomeDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
  setQuickActionDialog: (open: boolean, action?: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSelectedKpi: (kpiId: string | null) => void;
  setSelectedTranscript: (transcriptId: string | null) => void;
  toggleSidebar: () => void;
  setShowNotifications: (show: boolean) => void;
  incrementNotificationCount: () => void;
  clearNotificationCount: () => void;
  reset: () => void;
}

const initialState = {
  isWelcomeDialogOpen: false,
  isSettingsDialogOpen: false,
  isQuickActionDialogOpen: false,
  selectedQuickAction: null,
  isRefreshing: false,
  isSyncing: false,
  selectedKpiId: null,
  selectedTranscriptId: null,
  sidebarCollapsed: false,
  showNotifications: false,
  notificationCount: 0,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,

  setWelcomeDialogOpen: (open) =>
    set({ isWelcomeDialogOpen: open }),

  setSettingsDialogOpen: (open) =>
    set({ isSettingsDialogOpen: open }),

  setQuickActionDialog: (open, action = null) =>
    set({ isQuickActionDialogOpen: open, selectedQuickAction: action }),

  setRefreshing: (refreshing) =>
    set({ isRefreshing: refreshing }),

  setSyncing: (syncing) =>
    set({ isSyncing: syncing }),

  setSelectedKpi: (kpiId) =>
    set({ selectedKpiId: kpiId }),

  setSelectedTranscript: (transcriptId) =>
    set({ selectedTranscriptId: transcriptId }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setShowNotifications: (show) =>
    set({ showNotifications: show, notificationCount: show ? 0 : state => state.notificationCount }),

  incrementNotificationCount: () =>
    set((state) => ({ notificationCount: state.notificationCount + 1 })),

  clearNotificationCount: () =>
    set({ notificationCount: 0 }),

  reset: () =>
    set(initialState),
}));
