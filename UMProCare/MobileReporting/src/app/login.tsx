import React, { useState } from "react";
import { Alert, ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";

import { C } from "../constants/palette";
import { Page, Header, Card, Field, Button } from "../components/Kit";
import { login } from "../services/api";

export default function Login() {
  const [who, setWho] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const identifier = who.trim();

    if (!identifier || !pass) {
      Alert.alert(
        "Missing information",
        "Please enter your email or username and password."
      );
      return;
    }

    try {
      setLoading(true);

      // Calls your Laravel API and saves the authentication token.
      const user = await login(identifier, pass);

      if (user?.role === "admin") {
  router.replace("/admin/admin-dashboard" as any);
} else if (user?.role === "student" || user?.role === "teacher") {
  router.replace("/user/user-dashboard" as any);
} else {
  Alert.alert(
    "Account role not recognized",
    "Your account was signed in, but it does not have a supported app destination. Please contact the administrator."
  );
}
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <View
        style={{
          alignItems: "center",
          paddingTop: 30,
          gap: 7,
        }}
      >
        <View
          style={{
            backgroundColor: C.maroon,
            borderRadius: 16,
            width: 58,
            height: 58,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 23,
              fontWeight: "900",
            }}
          >
            UM
          </Text>
        </View>

        <Text
          style={{
            color: C.maroon,
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1,
          }}
        >
          UNIVERSITY OF MINDANAO
        </Text>

        <Text
          style={{
            fontSize: 25,
            fontWeight: "900",
            color: C.ink,
          }}
        >
          Property Care
        </Text>

        <Text
          style={{
            color: C.muted,
            textAlign: "center",
          }}
        >
          Damage Reporting & Monitoring System
        </Text>
      </View>

      <Card>
        <Header title="Welcome back" sub="Sign in to continue." />

        <Field
          label="Email or username"
          value={who}
          onChangeText={setWho}
          placeholder="Enter email or username"
          autoCapitalize="none"
        />

        <Field
          label="Password"
          value={pass}
          onChangeText={setPass}
          placeholder="Enter password"
          secureTextEntry
        />

        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator color={C.maroon} />
            <Text style={{ color: C.muted, marginTop: 8 }}>
              Signing in...
            </Text>
          </View>
        ) : (
          <Button title="Sign in" onPress={handleLogin} />
        )}

        <Text style={{ textAlign: "center", color: C.muted }}>
          New user?{" "}
          <Text
            onPress={() => router.push("/register" as any)}
            style={{ color: C.maroon, fontWeight: "800" }}
          >
            Create account
          </Text>
        </Text>
      </Card>

      <Text
        style={{
          textAlign: "center",
          fontSize: 11,
          color: C.muted,
        }}
      >
        Secure sign-in · University of Mindanao
      </Text>
    </Page>
  );
}