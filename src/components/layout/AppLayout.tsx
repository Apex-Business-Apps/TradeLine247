import { HelmetProvider } from "react-helmet-async";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { MiniChat } from "@/components/ui/MiniChat";

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

  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme || "system"}
        enableSystem
        disableTransitionOnChange={false}
      >
        <ThemeSync />
        <MotionPreferenceSync />
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
        {/* Global Chat Widget - uses startup splash robot icon */}
        <MiniChat />
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default AppLayout;
