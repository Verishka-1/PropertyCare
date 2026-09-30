import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Field, Button } from "../../components/Kit";
import { getMyProfile, logout, updateMyProfile } from "../../services/api";

type Profile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
};

function SettingsHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>Profile & settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>
    </View>
  );
}

export default function UserSettings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();

      setProfile(data);
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setEmail(data?.email ?? "");
      setUsername(data?.username ?? "");
    } catch (error: any) {
      Alert.alert(
        "Could not load profile",
        error?.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();
    const cleanUsername = username.trim();

    if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanUsername) {
      Alert.alert(
        "Missing information",
        "Please fill in your first name, last name, username, and email."
      );
      return;
    }

    setSaving(true);

    try {
      const updated = await updateMyProfile({
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: cleanEmail,
        username: cleanUsername,
      });

      setProfile(updated);
      setFirstName(updated?.first_name ?? cleanFirstName);
      setLastName(updated?.last_name ?? cleanLastName);
      setEmail(updated?.email ?? cleanEmail);
      setUsername(updated?.username ?? cleanUsername);

      Alert.alert("Profile updated", "Your account details have been saved.");
    } catch (error: any) {
      Alert.alert(
        "Save failed",
        error?.message || "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login" as any);
    } catch (error: any) {
      Alert.alert(
        "Logout failed",
        error?.message || "Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Page>
      <SettingsHeader />

      <Card>
        <Text style={{ color: C.ink, fontWeight: "800" }}>
          Profile details
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={C.ink} />
            <Text style={{ color: C.muted, marginTop: 8 }}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <>
            <Field
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
            />

            <Field
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
            />

            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={{ color: C.muted, fontSize: 11 }}>
              Account ID is system-managed and cannot be edited.
              {profile?.id ? ` Account ID: ${profile.id}` : ""}
            </Text>

            <View style={{ marginTop: 16 }}>
              <Button
                title={saving ? "Saving..." : "Save changes"}
                onPress={() => {
                  if (!saving) handleSave();
                }}
              />
            </View>
          </>
        )}
      </Card>

      <Button
        title={loggingOut ? "Logging out..." : "Log out"}
        outline
        onPress={() => {
          if (!loggingOut) handleLogout();
        }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 42,
    marginTop: -4,
    fontWeight: "400",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: C.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 3,
  },
});