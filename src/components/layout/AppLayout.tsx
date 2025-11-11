import { HelmetProvider } from "react-helmet-async";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { ThemeProvider, useTheme } from "next-themes";
import { lazy, Suspense, useEffect } from "react";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { Toaster } from "@/components/ui/sonner";
import { useKlaviyoAnalytics } from "@/hooks/useKlaviyoAnalytics";

// Lazy load non-critical UI components to reduce initial bundle size
const MiniChat = lazy(() => import("@/components/ui/MiniChat").then(module => ({ default: module.MiniChat })));
const ConnectionIndicator = lazy(() => import("@/components/ui/ConnectionIndicator").then(module => ({ default: module.ConnectionIndicator })));

// Component to apply reduceMotion preference to document
const MotionPreferenceSync = () => {
  const { reduceMotion } = useUserPreferencesStore();

  useEffect(() => {
    // Apply reduce motion preference to document root
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  return null;
};

// Component to sync theme from user preferences store on mount
const ThemeSync = () => {
  const { theme: preferenceTheme } = useUserPreferencesStore();
  const { theme: currentTheme, setTheme } = useTheme();

  useEffect(() => {
    // Sync theme from preferences store to next-themes on mount
    if (preferenceTheme && preferenceTheme !== currentTheme) {
      setTheme(preferenceTheme);
    }
  }, []); // Only run on mount

  useEffect(() => {
    // Keep them in sync when preference changes
    if (preferenceTheme && preferenceTheme !== currentTheme) {
      setTheme(preferenceTheme);
    }
  }, [preferenceTheme, currentTheme, setTheme]);

  return null;
};

export const AppLayout = () => {
  const { theme } = useUserPreferencesStore();
  const { pathname } = useLocation();

  // Initialize Klaviyo analytics tracking
  useKlaviyoAnalytics();

  useEffect(() => {
    document.body.setAttribute("data-page", pathname === "/" ? "home" : "page");
  }, [pathname]);

  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
      >
        <ThemeSync />
        <MotionPreferenceSync />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1" id="main">
            <Outlet />
          </main>
        </div>
        {/* Lazy-loaded Global Chat Widget - uses startup splash robot icon */}
        <Suspense fallback={null}>
          <MiniChat />
        </Suspense>
        {/* Lazy-loaded Connection Indicator - shows network status */}
        <Suspense fallback={null}>
          <ConnectionIndicator />
        </Suspense>
        {/* Enhanced Toast Notifications */}
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default AppLayout;
