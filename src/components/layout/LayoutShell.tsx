import { Outlet } from "react-router-dom";
import AppLayout from "./AppLayout";

export const LayoutShell = () => (
  <AppLayout>
    <main id="main-content" role="main" className="flex-1 outline-none">
      <Outlet />
    </main>
  </AppLayout>
);

export default LayoutShell;
