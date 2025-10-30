import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LayoutShell from "./components/layout/LayoutShell";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Features from "./pages/Features";
import NotFound from "./pages/NotFound";
import AuthLanding from "./pages/AuthLanding";

// If you have route guards/validators, keep them OUT of public pages for now.
// We’ll re-introduce once the pages render green.

const router = createBrowserRouter([
  {
    element: <LayoutShell />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/pricing", element: <Pricing /> },
      { path: "/faq", element: <FAQ /> },
      { path: "/features", element: <Features /> },
      { path: "/auth", element: <AuthLanding /> },
      { path: "*", element: <NotFound /> }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
