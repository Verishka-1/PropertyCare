import React, { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Header, Card, Button } from "../../components/Kit";
import { apiRequest, logout } from "../../services/api";

type AdminProfile = {
  name?: string;
  email?: string;
  role?: string;
};

const settingsItems = [
  "Profile details",
  "Change password",
  "Notification preferences",
  "Security & access",
];

export default function AdminSettings() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);

    try {
      const result = await apiRequest("/me");
      setProfile(result?.user ?? result?.data ?? result);
    } catch (error) {
      // The screen remains usable if the profile endpoint is unavailable.
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out of the admin account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);

            try {
              await logout();
            } catch {
              // logout() clears the locally stored token in its finally block.
            } finally {
              setLoggingOut(false);
              router.replace("/login" as any);
            }
          },
        },
      ]
    );
  };

  const openSetting = (setting: string) => {
    Alert.alert(
      setting,
      "This setting is not connected yet. It will need a matching screen or backend endpoint before it can be changed."
    );
  };

  return (
    <Page>
      <Header
        title="Admin settings"
        sub="Account and system preferences"
        back
      />

      <Card>
        <Text style={{ fontWeight: "800", color: C.ink }}>
          {loadingProfile
            ? "Loading admin profile..."
            : profile?.name || "System Administrator"}
        </Text>

        <Text style={{ color: C.muted, marginTop: 3 }}>
          {loadingProfile
            ? " "
            : profile?.email || "Admin email unavailable"}
        </Text>

        {!loadingProfile && profile?.role ? (
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              marginTop: 3,
              textTransform: "capitalize",
            }}
          >
            {profile.role}
          </Text>
        ) : null}

        <View style={{ marginTop: 12 }}>
          {settingsItems.map((item) => (
            <Text
              key={item}
              onPress={() => openSetting(item)}
              accessibilityRole="button"
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F0EAED",
                color: C.ink,
                fontWeight: "600",
              }}
            >
              {item}  ›
            </Text>
          ))}
        </View>
      </Card>

      <Button
        title={loggingOut ? "Logging out..." : "Log out"}
        outline
        onPress={handleLogout}
      />
    </Page>
  );
}