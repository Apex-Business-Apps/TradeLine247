// src/layout/LayoutShell.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { HeaderErrorBoundary } from "@/components/layout/HeaderErrorBoundary";

export default function LayoutShell() {
  return (
    <>
      <HeaderErrorBoundary>
        <Header />
      </HeaderErrorBoundary>
      <main id="content" className="min-h-[60vh]">
        <Outlet />
      </main>
    </>
  );
}
