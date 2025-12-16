import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apex.tradeline',   // must match your ASC bundle id
  appName: 'TradeLine 24/7',
  webDir: 'dist',
  server: {
    // CRITICAL: Prevents localStorage wipe on Capacitor upgrade
    androidScheme: 'http',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#1a1a2e', // TradeLine brand dark
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
