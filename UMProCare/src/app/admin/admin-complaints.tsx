import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";

import { Page, Header, Card, Button } from "../../components/Kit";
import { apiRequest } from "../../services/api";

type Complaint = {
  id: number | string;
  subject?: string;
  title?: string;
  message?: string;
  body?: string;
  user?: {
    name?: string;
    email?: string;
  } | null;
  user_name?: string;
  email?: string;
  created_at?: string;
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/admin/complaints");

      const rows = Array.isArray(result) ? result : result?.data;

      if (!Array.isArray(rows)) {
        throw new Error("The complaints API returned an unexpected response.");
      }

      setComplaints(rows);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load complaints.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleReply = async (complaint: Complaint) => {
    const email = complaint.user?.email ?? complaint.email;

    if (!email) {
      Alert.alert(
        "Email unavailable",
        "There is no email address saved for this complaint."
      );
      return;
    }

    const subject = complaint.subject ?? complaint.title ?? "Campus feedback";
    const message = complaint.message ?? complaint.body ?? "";

    const mailtoUrl =
      `mailto:${email}` +
      `?subject=${encodeURIComponent(`Re: ${subject}`)}` +
      `&body=${encodeURIComponent(
        `Hello ${complaint.user?.name ?? complaint.user_name ?? ""},\n\n` +
          `Regarding your message:\n${message}\n\n`
      )}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert(
        "Could not open email",
        "No email app appears to be available on this device."
      );
    }
  };

  return (
    <Page>
      <Header
        title="Complaints & feedback"
        sub="Messages from campus users"
        back
      />

      <View style={{ gap: 12 }}>
        <Button
          title={loading ? "Loading..." : "Refresh complaints"}
          outline
          onPress={loadComplaints}
        />

        {loading ? (
          <Card>
            <Text style={{ color: "#756B70" }}>
              Loading complaints...
            </Text>
          </Card>
        ) : error ? (
          <Card>
            <Text style={{ color: "#B00020", fontWeight: "700" }}>
              Could not load complaints
            </Text>
            <Text style={{ color: "#756B70" }}>{error}</Text>
            <Button title="Try again" onPress={loadComplaints} />
          </Card>
        ) : complaints.length === 0 ? (
          <Card>
            <Text style={{ color: "#756B70", textAlign: "center" }}>
              No complaints or feedback have been submitted yet.
            </Text>
          </Card>
        ) : (
          complaints.map((complaint) => {
            const subject =
              complaint.subject ?? complaint.title ?? "Complaint or feedback";
            const sender =
              complaint.user?.name ?? complaint.user_name ?? "Campus user";
            const message =
              complaint.message ?? complaint.body ?? "No message provided.";

            return (
              <Card key={String(complaint.id)}>
                <Text style={{ fontWeight: "800", fontSize: 15 }}>
                  {subject}
                </Text>

                <Text style={{ color: "#756B70", fontSize: 12 }}>
                  {sender}
                  {complaint.created_at
                    ? ` · ${new Date(complaint.created_at).toLocaleDateString()}`
                    : ""}
                </Text>

                <Text>{message}</Text>

                <Button
                  title="Reply by email"
                  outline
                  onPress={() => handleReply(complaint)}
                />
              </Card>
            );
          })
        )}
      </View>
    </Page>
  );
}