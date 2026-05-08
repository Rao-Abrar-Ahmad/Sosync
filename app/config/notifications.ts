import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sos-alerts', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return undefined;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn('Project ID not found for push notifications');
      return undefined;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = pushTokenData.data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

/**
 * Save the user's push token to Firestore for later use
 */
export async function savePushToken(userId: string, pushToken: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { expo_push_token: pushToken });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Send SOS push notification to emergency contacts via Expo Push Service
 * @param expoPushTokens - Array of Expo push tokens of emergency contacts
 * @param senderName - Name of the person triggering SOS
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 */
export async function sendSOSPushNotification(
  expoPushTokens: string[],
  senderName: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const messages = expoPushTokens.map((token) => ({
    to: token,
    sound: 'default',
    title: '🚨 SOS EMERGENCY ALERT',
    body: `${senderName} needs help! Location: ${mapsUrl}`,
    data: {
      type: 'SOS_ALERT',
      latitude,
      longitude,
      senderName,
      mapsUrl,
    },
    priority: 'high' as const,
    channelId: 'sos-alerts',
  }));

  // Send in batches (Expo allows up to 100 per request)
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
