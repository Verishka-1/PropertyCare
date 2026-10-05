import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { registerPushToken } from "./api";

/**
 * What happens when a notification arrives while
 * the app is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register this device for push notifications.
 */
export async function registerForPushNotifications() {
  try {
    /*
     * Push notifications require a physical device.
     */
    if (!Device.isDevice) {
      console.log(
        "Push notifications require a physical device."
      );

      return null;
    }

    /*
     * Android notification channel.
     */
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "default",
        {
          name: "Default",
          importance:
            Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
        }
      );
    }

    /*
     * Check existing permissions.
     */
    const existing =
      await Notifications.getPermissionsAsync();

    let finalStatus = existing.status;

    /*
     * Ask the user if permission has not been granted.
     */
    if (finalStatus !== "granted") {
      const requested =
        await Notifications.requestPermissionsAsync();

      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "Push notification permission was not granted."
      );

      return null;
    }

    /*
     * Expo project ID.
     */
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error(
        "Expo projectId is missing."
      );

      return null;
    }

    /*
     * Get Expo push token.
     */
    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = token.data;

    console.log(
      "Expo Push Token:",
      expoPushToken
    );

    /*
     * Save token to Laravel.
     */
    await registerPushToken(expoPushToken);

    return expoPushToken;
  } catch (error) {
    console.error(
      "Failed to register push notifications:",
      error
    );

    return null;
  }
}