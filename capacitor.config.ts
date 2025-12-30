import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apex.tradeline',   // must match Xcode project & App Store Connect
  appName: 'TradeLine 24/7',
  webDir: 'dist',
  server: {
    // CRITICAL: Prevents localStorage wipe on Capacitor upgrade
    androidScheme: 'http',
  },
};

export default config;
