// FILE: src/App.tsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Features from "./pages/Features";
import Auth from "./pages/Auth";
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
            <Route path="auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
