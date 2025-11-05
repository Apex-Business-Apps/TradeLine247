// FILE: src/App.tsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import SafeErrorBoundary from "./components/errors/SafeErrorBoundary";
import { router, appRoutePaths as routedPaths } from "./routes/router";

const LoadingFallback = () => (
  <div
    style={{
      minHeight: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.125rem",
      color: "hsl(var(--muted-foreground))",
    }}
  >
    Loading...
  </div>
);

export const appRoutePaths = routedPaths;

export default function App() {
  return (
    <SafeErrorBoundary>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <RouterProvider router={router} fallbackElement={<LoadingFallback />} />
      </div>
    </SafeErrorBoundary>
  );
}
