import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Field, Button } from "../../components/Kit";
import { apiRequest } from "../../services/api";

function FeedbackHeader() {
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
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>Complaints & feedback</Text>
        <Text style={styles.headerSubtitle}>Message the administration</Text>
      </View>
    </View>
  );
}

export default function Feedback() {
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const sendFeedback = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = msg.trim();

    if (!cleanSubject || !cleanMessage) {
      Alert.alert(
        "Missing information",
        "Please enter both a subject and a message."
      );
      return;
    }

    setSending(true);

    try {
      await apiRequest("/complaints", {
        method: "POST",
        body: JSON.stringify({
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });

      setSubject("");
      setMsg("");

      Alert.alert(
        "Feedback sent",
        "Your message has been submitted to the administration."
      );
    } catch (error) {
      Alert.alert(
        "Could not send feedback",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Page>
      <FeedbackHeader />

      <Card>
        <Field
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Subject"
        />

        <Field
          label="Message"
          value={msg}
          onChangeText={setMsg}
          placeholder="Write your message..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Button
          title={sending ? "Sending..." : "Send feedback"}
          onPress={sending ? () => {} : sendFeedback}
        />
      </Card>
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
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: C.maroon,
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 4,
  },
});