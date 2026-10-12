import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Button } from "../../components/Kit";
import { apiRequest, logout } from "../../services/api";

type AdminProfile = {
  name?: string;
  email?: string;
  role?: string;
};

type ActiveForm = "email" | "password" | null;

export default function AdminSettings() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const result = await apiRequest("/me");
      const data = result?.user ?? result?.data ?? result;

      setProfile(data);
      setNewEmail(data?.email ?? "");
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleBack = () => {
    if (saving || loggingOut) return;

    if (activeForm) {
      setActiveForm(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    router.back();
  };

  const handleLogout = () => {
    if (loggingOut || saving) return;

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
              // Continue to login after logout cleanup.
            } finally {
              setLoggingOut(false);
              router.replace("/login" as any);
            }
          },
        },
      ]
    );
  };

  const handleSaveEmail = async () => {
    const email = newEmail.trim().toLowerCase();

    if (!email) {
      Alert.alert("Missing email", "Please enter your new email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (email === profile?.email?.toLowerCase()) {
      Alert.alert("No changes", "Your email address has not changed.");
      return;
    }

    Alert.alert(
      "Security Notice",
      "For security purposes, changes to the administrator's email address and password must be made through the authorized database. These credentials cannot be modified directly through the application. This restriction helps prevent unauthorized changes to administrator account credentials."
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing information", "Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Weak password",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Your new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Invalid password",
        "Your new password must be different from your current password."
      );
      return;
    }

    Alert.alert(
      "Security Notice",
      "For security purposes, changes to the administrator's email address and password must be made through the authorized database. These credentials cannot be modified directly through the application. This restriction helps prevent unauthorized changes to administrator account credentials."
    );
  };

  const openForm = (form: ActiveForm) => {
    setActiveForm(form);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
            pressed && styles.pressed,
            (saving || loggingOut) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
              {(profile?.name?.charAt(0) || "A").toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              Profile details
            </Text>
            <Text style={styles.cardSubtitle}>
              Your administrator account information
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={C.maroon} />
            <Text style={styles.loadingText}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>
              {profile?.name || "System Administrator"}
            </Text>
            <Text style={styles.accountEmail}>
              {profile?.email || "Admin email unavailable"}
            </Text>
            {profile?.role ? (
              <Text style={styles.accountRole}>
                {profile.role}
              </Text>
            ) : null}
          </View>
        )}
      </Card>

      {/* ACCOUNT OPTIONS */}
      <Card>
        <Text style={styles.sectionTitle}>
          Account settings
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.settingRow,
            pressed && styles.pressed,
          ]}
          onPress={() => openForm("email")}
          disabled={saving || loggingOut}
        >
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>
              Change email
            </Text>
            <Text style={styles.settingSubtitle}>
              Update your email address
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.settingRow,
            pressed && styles.pressed,
          ]}
          onPress={() => openForm("password")}
          disabled={saving || loggingOut}
        >
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>
              Change password
            </Text>
            <Text style={styles.settingSubtitle}>
              Keep your account secure
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </Card>

      {/* CHANGE EMAIL FORM */}
      {activeForm === "email" && (
        <Card>
          <Text style={styles.sectionTitle}>
            Change email
          </Text>

          <Text style={styles.fieldLabel}>
            New email address
          </Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor={C.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          <View style={styles.formButton}>
            <Button
              title={saving ? "Saving..." : "Save email"}
              onPress={handleSaveEmail}
            />
          </View>

          <Pressable
            style={styles.cancelButton}
            onPress={() => setActiveForm(null)}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Card>
      )}

      {/* CHANGE PASSWORD FORM */}
      {activeForm === "password" && (
        <Card>
          <Text style={styles.sectionTitle}>
            Change password
          </Text>

          <Text style={styles.fieldLabel}>
            Current password
          </Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={C.muted}
            secureTextEntry
            autoCapitalize="none"
            editable={!saving}
          />

          <Text style={styles.fieldLabel}>
            New password
          </Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={C.muted}
            secureTextEntry
            autoCapitalize="none"
            editable={!saving}
          />

          <Text style={styles.fieldLabel}>
            Confirm new password
          </Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={C.muted}
            secureTextEntry
            autoCapitalize="none"
            editable={!saving}
          />

          <View style={styles.formButton}>
            <Button
              title={saving ? "Saving..." : "Update password"}
              onPress={handleChangePassword}
            />
          </View>

          <Pressable
            style={styles.cancelButton}
            onPress={() => setActiveForm(null)}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Card>
      )}

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
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    color: C.muted,
    marginTop: 9,
    fontSize: 13,
  },
  accountInfo: {
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
  },
  accountName: {
    color: C.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  accountEmail: {
    color: C.muted,
    fontSize: 13,
    marginTop: 5,
  },
  accountRole: {
    color: C.maroon,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    marginTop: 5,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  settingSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },
  arrow: {
    color: C.maroon,
    fontSize: 28,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EAED",
  },
  fieldLabel: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5DDE0",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: C.ink,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  formButton: {
    marginTop: 18,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 4,
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
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.5,
  },
});
