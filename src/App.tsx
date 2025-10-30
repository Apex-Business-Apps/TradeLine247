import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LayoutShell from "./components/layout/LayoutShell";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Features from "./pages/Features";
import NotFound from "./pages/NotFound";
import AuthLanding from "./pages/AuthLanding";

export default function App() {
  return (
    <BrowserRouter>
      {/* Plain v6 Router (no data APIs). Suspense avoids blank screens on lazy bits elsewhere. */}
      <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
        <Routes>
          <Route element={<LayoutShell />}>
            <Route index element={<Home />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="features" element={<Features />} />
            <Route path="auth" element={<AuthLanding />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
