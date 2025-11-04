import React from "react";
import { RouterProvider } from "react-router-dom";
import { router, appRoutePaths } from "./routes";

export { appRoutePaths };

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <RouterProvider router={router} />
    </div>
  );
}
