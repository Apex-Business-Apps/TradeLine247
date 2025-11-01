// FILE: src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
// CRITICAL: Index route must be eager (not lazy) for immediate FCP on homepage
import Index from "./pages/Index";

// PERFORMANCE: Route-based code splitting - lazy load all routes except Index (critical)
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Features = lazy(() => import("./pages/Features"));
const Compare = lazy(() => import("./pages/Compare"));
const Security = lazy(() => import("./pages/Security"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const CallCenter = lazy(() => import("./pages/CallCenter"));
const CallLogs = lazy(() => import("./pages/CallLogs"));
const Integrations = lazy(() => import("./pages/Integrations"));
const ClientNumberOnboarding = lazy(() => import("./pages/ops/ClientNumberOnboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component for better UX during lazy loading
const LoadingFallback = () => (
  <div
    style={{
      minHeight: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.125rem",
      color: "hsl(var(--muted-foreground))"
    }}
  >
    Loading...
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      {/* Suspense prevents a white screen if any child is lazy elsewhere */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="features" element={<Features />} />
            <Route path="compare" element={<Compare />} />
            <Route path="security" element={<Security />} />
            <Route path="contact" element={<Contact />} />
            <Route path="auth" element={<Auth />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="call-center" element={<CallCenter />} />
            <Route path="call-logs" element={<CallLogs />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="ops/number-onboarding" element={<ClientNumberOnboarding />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
