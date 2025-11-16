import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { HeaderErrorBoundary } from "./HeaderErrorBoundary";

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