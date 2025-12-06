import { Outlet } from "react-router-dom";
import AppLayout from "./AppLayout";

export const LayoutShell = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

export default LayoutShell;
