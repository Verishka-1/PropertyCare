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
import {
  getMyProfile,
  logout,
  updateMyProfile,
} from "../../services/api";

type Profile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
};

export default function UserSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * Load profile from Laravel
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMyProfile();

      setProfile(data);

      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setEmail(data?.email ?? "");
      setUsername(data?.username ?? "");
    } catch (error: any) {
      Alert.alert(
        "Could not load profile",
        error?.message || "Unable to load your account information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload profile whenever this screen gets focus
   */
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  /**
   * Check whether the user changed anything
   */
  const hasChanges = () => {
    if (!profile) return false;

    return (
      firstName.trim() !== (profile.first_name ?? "") ||
      lastName.trim() !== (profile.last_name ?? "") ||
      email.trim() !== (profile.email ?? "") ||
      username.trim() !== (profile.username ?? "")
    );
  };

  /**
   * Reset fields to the values from the server
   */
  const handleCancel = () => {
    if (!profile) return;

    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setEmail(profile.email ?? "");
    setUsername(profile.username ?? "");
  };

  /**
   * Save profile
   */
  const handleSave = async () => {
    if (saving) return;

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Required fields
    if (!cleanFirstName) {
      Alert.alert("Missing information", "Please enter your first name.");
      return;
    }

    if (!cleanLastName) {
      Alert.alert("Missing information", "Please enter your last name.");
      return;
    }

    if (!cleanUsername) {
      Alert.alert("Missing information", "Please enter your username.");
      return;
    }

    if (!cleanEmail) {
      Alert.alert("Missing information", "Please enter your email.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address."
      );
      return;
    }

    // Username validation
    if (cleanUsername.length < 3) {
      Alert.alert(
        "Invalid username",
        "Username must contain at least 3 characters."
      );
      return;
    }

    // Nothing changed
    if (!hasChanges()) {
      Alert.alert(
        "No changes",
        "There are no changes to save."
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

      /**
       * Update local profile using server response
       */
      const newProfile: Profile = {
        id: updated?.id ?? profile?.id ?? 0,
        first_name: updated?.first_name ?? cleanFirstName,
        last_name: updated?.last_name ?? cleanLastName,
        email: updated?.email ?? cleanEmail,
        username: updated?.username ?? cleanUsername,
      };

      setProfile(newProfile);

      setFirstName(newProfile.first_name);
      setLastName(newProfile.last_name);
      setEmail(newProfile.email);
      setUsername(newProfile.username);

      Alert.alert(
        "Profile updated",
        "Your account details have been saved successfully."
      );
    } catch (error: any) {
      Alert.alert(
        "Save failed",
        error?.message || "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();

      router.replace("/login" as any);
    } catch (error: any) {
      Alert.alert(
        "Logout failed",
        error?.message || "Could not log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  /**
   * Back button
   */
  const handleBack = () => {
    if (saving || loggingOut) return;

    router.back();
  };

  return (
    <Page>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          disabled={saving || loggingOut}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
            (saving || loggingOut) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Profile & settings
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your account
          </Text>
        </View>
      </View>

      {/* PROFILE CARD */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>
              {firstName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              Profile details
            </Text>

            <Text style={styles.cardSubtitle}>
              Update your personal information
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={C.maroon}
            />

            <Text style={styles.loadingText}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <>
            {/* FIRST NAME */}
            <Field
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              editable={!saving}
            />

            {/* LAST NAME */}
            <Field
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              editable={!saving}
            />

            {/* USERNAME */}
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!saving}
            />

            {/* EMAIL */}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />

            {/* ACCOUNT ID */}
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>
                Account ID
              </Text>

              <Text style={styles.accountValue}>
                {profile?.id ?? "—"}
              </Text>

              <Text style={styles.accountDescription}>
                This ID is managed by the system and cannot be edited.
              </Text>
            </View>

            {/* SAVE / CANCEL */}
            <View style={styles.buttonGroup}>
              <Button
                title={saving ? "Saving..." : "Save changes"}
                onPress={handleSave}
              />

              {hasChanges() && !saving && (
                <Pressable
                  onPress={handleCancel}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.cancelButtonPressed,
                  ]}
                >
                  <Text style={styles.cancelText}>
                    Cancel changes
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </Card>

      {/* LOGOUT */}
      <View style={styles.logoutContainer}>
        <Button
          title={loggingOut ? "Logging out..." : "Log out"}
          outline
          onPress={handleLogout}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 18,
  },

  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  profileIconText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "800",
  },

  cardSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },

  loadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: C.muted,
    marginTop: 9,
    fontSize: 13,
  },

  accountInfo: {
    marginTop: 12,
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
  },

  accountLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  accountValue: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },

  accountDescription: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },

  buttonGroup: {
    marginTop: 18,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    marginTop: 8,
  },

  cancelButtonPressed: {
    opacity: 0.6,
  },

  cancelText: {
    color: C.maroon,
    fontSize: 14,
    fontWeight: "700",
  },

  logoutContainer: {
    marginTop: 14,
    marginBottom: 20,
  },

  disabled: {
    opacity: 0.5,
  },
});