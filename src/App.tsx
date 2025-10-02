import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Inventory from "./pages/Inventory";
import Quotes from "./pages/Quotes";
import QuoteBuilder from "./pages/QuoteBuilder";
import CreditApps from "./pages/CreditApps";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import Compliance from "./pages/Compliance";
import CreditApplication from "./pages/CreditApplication";
import Growth from "./pages/Growth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AIChatWidget } from "./components/Chat/AIChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createSyncStoragePersister({ 
  storage: window.localStorage,
  key: 'AUTOAI_CACHE',
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to deserialize cache, clearing...', error);
      window.localStorage.removeItem('AUTOAI_CACHE');
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

const App = () => (
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
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
      <AIChatWidget />
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
