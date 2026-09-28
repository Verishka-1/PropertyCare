import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { COLORS, Spacing } from "../constants/theme";
import { register } from "../services/api";

type Role = "student" | "teacher";

// Mirrors the backend's Password::min(8)->mixedCase()->symbols() rule
// (see AuthController::register) so the person gets instant feedback
// instead of waiting for a server round-trip.
function getPasswordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  return null;
}

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFirstName || !cleanLastName || !cleanUsername || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("Required Fields", "Please complete all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const usernamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!usernamePattern.test(cleanUsername)) {
      Alert.alert(
        "Invalid Username",
        "Username can only contain letters, numbers, hyphens, and underscores."
      );
      return;
    }

    const passwordProblem = getPasswordProblem(password);
    if (passwordProblem) {
      Alert.alert("Invalid Password", passwordProblem);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: cleanFirstName,
        last_name: cleanLastName,
        username: cleanUsername,
        email: cleanEmail,
        role,
        password,
        password_confirmation: confirmPassword,
      });

      Alert.alert(
        "Registration Successful",
        "Your account has been created. You can now sign in.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login" as any),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error
          ? error.message
          : "Please check your information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to report school property damage
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={COLORS.gray}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.half}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={COLORS.gray}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor={COLORS.gray}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {(["student", "teacher"] as Role[]).map((option) => {
              const selected = role === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.roleButton, selected && styles.roleButtonSelected]}
                  onPress={() => setRole(option)}
                  disabled={loading}
                >
                  <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                    {option === "student" ? "Student" : "Teacher"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            returnKeyType="next"
          />
          <Text style={styles.hint}>
            At least 8 characters, with one uppercase letter and one special character.
          </Text>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={COLORS.gray}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.replace("/login" as any)}
              disabled={loading}
            >
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighterMaroon,
  },

  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: "center",
  },

  backButton: {
    marginBottom: Spacing.lg,
  },

  backText: {
    color: COLORS.maroon,
    fontSize: 15,
    fontWeight: "600",
  },

  header: {
    marginBottom: Spacing.xl,
  },

  title: {
    color: COLORS.maroon,
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  half: {
    flex: 1,
  },

  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: COLORS.text,
    marginBottom: Spacing.md,
  },

  hint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: -6,
    marginBottom: Spacing.md,
  },

  roleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  roleButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.maroon,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  roleButtonSelected: {
    backgroundColor: COLORS.maroon,
  },

  roleText: {
    color: COLORS.maroon,
    fontWeight: "700",
    fontSize: 13,
  },

  roleTextSelected: {
    color: COLORS.white,
  },

  button: {
    height: 50,
    backgroundColor: COLORS.maroon,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },

  loginText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  loginLink: {
    color: COLORS.maroon,
    fontWeight: "700",
    fontSize: 13,
  },
});
