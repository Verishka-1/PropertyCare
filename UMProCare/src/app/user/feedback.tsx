import React, { useState } from "react";
import { Alert } from "react-native";

import { Page, Header, Card, Field, Button } from "../../components/Kit";
import { apiRequest } from "../../services/api";

export default function Feedback() {
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const sendFeedback = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = msg.trim();

    if (!cleanSubject || !cleanMessage) {
      Alert.alert("Missing information", "Please enter both a subject and a message.");
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
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Page>
      <Header
        title="Complaints & feedback"
        sub="Message the administration"
        back
      />

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