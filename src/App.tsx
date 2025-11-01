// FILE: src/App.tsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Features from "./pages/Features";
import Compare from "./pages/Compare";
import Security from "./pages/Security";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/ClientDashboard";
import CallCenter from "./pages/CallCenter";
import CallLogs from "./pages/CallLogs";
import Integrations from "./pages/Integrations";
import ClientNumberOnboarding from "./pages/ops/ClientNumberOnboarding";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      {/* Suspense prevents a white screen if any child is lazy elsewhere */}
      <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
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
