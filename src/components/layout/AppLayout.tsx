import { HelmetProvider } from "react-helmet-async";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export const AppLayout = () => {
  return (
    <HelmetProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default AppLayout;
