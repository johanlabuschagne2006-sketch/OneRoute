import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oneroute.app',
  appName: 'One Route',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
    // Removed "url" so it uses bundled build instead of external website
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0EA5E9",
      showSpinner: false,
      spinnerColor: "#FFFFFF"
    },
    StatusBar: {
      style: 'default',
      backgroundColor: "#0EA5E9"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Geolocation: {
      permissions: {
        location: "always"
      }
    }
  }
};

export default config;
