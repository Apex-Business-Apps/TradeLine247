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
    StatusBar: {
      overlaysWebView: true,
      style: 'Dark',
      backgroundColor: '#00000000', // Transparent for edge-to-edge
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
