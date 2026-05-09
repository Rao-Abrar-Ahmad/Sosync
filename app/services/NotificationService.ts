import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { updateUserPushToken } from "../config/dbutils";

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  // Set up notification channels for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sos-alerts", {
      name: "SOS Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    console.log("Push Token:", token);

    // Save token to Firestore
    await updateUserPushToken(userId, token);

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export function setupNotificationListeners() {
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification Received (Foreground):", notification);
    },
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification Response:", response);
    });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Send SOS push notification to emergency contacts via Expo Push Service
 */
export async function sendSOSPushNotification(
  expoPushTokens: string[],
  senderName: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const messages = expoPushTokens.map((token) => ({
    to: token,
    sound: "default",
    title: "🚨 SOS EMERGENCY ALERT",
    body: `${senderName} needs help! View location on map.`,
    data: {
      type: "SOS_ALERT",
      latitude,
      longitude,
      senderName,
      mapsUrl,
    },
    priority: "high" as const,
    channelId: "sos-alerts",
  }));

  // Send in batches (Expo allows up to 100 per request)
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
}
