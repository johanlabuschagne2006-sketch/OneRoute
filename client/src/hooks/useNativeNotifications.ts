import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export function useNativeNotifications() {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const setupNotifications = async () => {
      // Request permission for local notifications
      try {
        await LocalNotifications.requestPermissions();
      } catch (error) {
        console.log('Local notifications not available:', error);
      }

      // Request permission for push notifications
      try {
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
      } catch (error) {
        console.log('Push notifications not available:', error);
      }
    };

    setupNotifications();
  }, [isNative]);

  const sendLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: any
  ) => {
    if (!isNative) {
      // Web fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          extra: data,
          schedule: { at: new Date(Date.now() + 1000) } // 1 second delay
        }]
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }, [isNative]);

  const requestWebNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    sendLocalNotification,
    requestWebNotificationPermission,
    isNative
  };
}