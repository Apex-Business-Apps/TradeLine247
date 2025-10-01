import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8c580ccbd2ed4900a1daf3b4f211efc8',
  appName: 'AutoRepAi',
  webDir: 'dist',
  server: {
    url: 'https://8c580ccb-d2ed-4900-a1da-f3b4f211efc8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
