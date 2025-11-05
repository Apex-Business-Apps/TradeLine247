// src/layout/LayoutShell.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";

export default function LayoutShell() {
  return (
    <>
      <Header />
      <main id="content" className="min-h-[60vh]">
        <Outlet />
      </main>
    </>
  );
}
