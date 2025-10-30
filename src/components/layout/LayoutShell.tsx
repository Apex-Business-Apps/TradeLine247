import { Outlet } from "react-router-dom";
import { Header } from "./Header";
// If you have a Footer component, import it here:
// import Footer from "./Footer";

export default function LayoutShell() {
  return (
    <>
      <Header />
      <main id="content" className="min-h-[60vh]">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </>
  );
}
