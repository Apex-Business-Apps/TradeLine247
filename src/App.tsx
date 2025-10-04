import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ErrorBoundary } from "@/lib/observability/errorBoundary";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Routes, Route, useLocation } from "react-router-dom";
import { safeStorage } from "@/lib/storage/safeStorage";

// Eager load critical routes
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

// Eager load critical components that are always needed
import { EnhancedAIChatWidget } from "./components/Chat/EnhancedAIChatWidget";

// Lazy load non-critical routes for better initial load performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Quotes = lazy(() => import("./pages/Quotes"));
const QuoteBuilder = lazy(() => import("./pages/QuoteBuilder"));
const CreditApps = lazy(() => import("./pages/CreditApps"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Settings = lazy(() => import("./pages/Settings"));
const Compliance = lazy(() => import("./pages/Compliance"));
const CreditApplication = lazy(() => import("./pages/CreditApplication"));
const Growth = lazy(() => import("./pages/Growth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({ 
  storage: safeStorage,
  key: 'AUTOAI_CACHE',
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to deserialize cache, clearing...', error);
      safeStorage.removeItem('AUTOAI_CACHE');
      return undefined;
    }
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ 
        persister, 
        buster: 'v3-20251001',
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: () => true,
        },
      }}
      onSuccess={() => {
        console.log('React Query cache restored successfully');
      }}
    >
        <Toaster />
        <Sonner />
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
            <Route path="/quotes/new" element={<ProtectedRoute><QuoteBuilder /></ProtectedRoute>} />
            <Route path="/credit-apps" element={<ProtectedRoute><CreditApps /></ProtectedRoute>} />
            <Route path="/credit-apps/new" element={<ProtectedRoute><CreditApplication /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/growth" element={<ProtectedRoute><Growth /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <EnhancedAIChatWidget />
        </Suspense>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
