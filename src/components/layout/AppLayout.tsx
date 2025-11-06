import { PropsWithChildren, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Header } from "./Header";
import { ThemeProvider, useTheme } from "next-themes";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { MiniChat } from "@/components/ui/MiniChat";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { Toaster } from "@/components/ui/sonner";
import { useKlaviyoAnalytics } from "@/hooks/useKlaviyoAnalytics";

const MotionPreferenceSync = () => {
  const { reduceMotion } = useUserPreferencesStore();

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reduceMotion]);

  return null;
};

const ThemeSync = () => {
  const { theme: preferenceTheme } = useUserPreferencesStore();
  const { theme: currentTheme, setTheme } = useTheme();

  useEffect(() => {
    if (preferenceTheme && preferenceTheme !== currentTheme) {
      setTheme(preferenceTheme);
    }
  }, []);

  useEffect(() => {
    if (preferenceTheme && preferenceTheme !== currentTheme) {
      setTheme(preferenceTheme);
    }
  }, [preferenceTheme, currentTheme, setTheme]);

  return null;
};

export const AppLayout = ({ children }: PropsWithChildren) => {
  useKlaviyoAnalytics();

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
        <ThemeSync />
        <MotionPreferenceSync />
        <div className="flex min-h-screen flex-col">
          <Header />
          {children}
        </div>
        <MiniChat />
        <ConnectionIndicator />
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default AppLayout;
