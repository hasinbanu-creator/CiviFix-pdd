import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';
import ENDPOINTS from '../constants/endpoints';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications module could not be loaded", e);
  }
}

class NotificationService {
  async registerForPushNotificationsAsync() {
    let token;

    if (isExpoGo || !Notifications) {
      console.log("Running in Expo Go - Push notification registration skipped.");
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      })).data;
    } else {
      console.warn('Must use physical device for Push Notifications');
    }

    return token;
  }

  async syncTokenWithServer(token) {
    if (!token) return;
    try {
      // Stub for backend push notification registration
      // await api.post('/notifications/register-device', { push_token: token });
      console.log("Device token registered internally (STUB):", token);
    } catch (e) {
      console.error("Failed to sync push token with server", e);
    }
  }

  setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    if (isExpoGo || !Notifications) {
      console.log("Running in Expo Go - Remote notification listeners skipped.");
      return () => {};
    }

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      if (onNotificationReceived) onNotificationReceived(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationResponse) onNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }
}

export default new NotificationService();
