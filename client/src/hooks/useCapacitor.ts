import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    const setupCapacitor = async () => {
      const native = Capacitor.isNativePlatform();
      const platformName = Capacitor.getPlatform();
      
      setIsNative(native);
      setPlatform(platformName);

      if (native) {
        // Configure status bar for mobile
        try {
          await StatusBar.setStyle({ style: Style.Default });
          await StatusBar.setBackgroundColor({ color: '#0EA5E9' });
        } catch (error) {
          console.log('StatusBar not available:', error);
        }

        // Hide splash screen after app loads
        try {
          await SplashScreen.hide();
        } catch (error) {
          console.log('SplashScreen not available:', error);
        }
      }
    };

    setupCapacitor();
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
}