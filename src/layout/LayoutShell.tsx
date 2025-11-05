import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

export default function LayoutShell() {
  return (
    <AppLayout>
      <main id="content" className="min-h-[60vh]">
        <Outlet />
      </main>
    </AppLayout>
  );
}
