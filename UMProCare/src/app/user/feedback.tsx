
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Field, Button, Pill } from "../../components/Kit";
import { apiRequest, getMyComplaints } from "../../services/api";

type Complaint = {
  id: number;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function FeedbackHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>
          Complaints & feedback
        </Text>
        <Text style={styles.headerSubtitle}>
          Message the administration
        </Text>
      </View>
    </View>
  );
}

export default function Feedback() {
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintError, setComplaintError] = useState("");

  const loadComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");

      const result = await getMyComplaints();

      // Supports API helpers that return either the full response
      // or the response's data field.
      const rows = result?.data ?? result;

      if (!Array.isArray(rows)) {
        throw new Error("Unexpected response from the server.");
      }

      setComplaints(rows);
    } catch (error) {
      setComplaintError(
        error instanceof Error
          ? error.message
          : "Could not load your feedback."
      );
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

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

    try {
      setSending(true);

      await apiRequest("/complaints", {
        method: "POST",
        body: JSON.stringify({
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });

      setSubject("");
      setMsg("");

      // Reload the history so the new complaint appears.
      await loadComplaints();

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

      {/* SUBMIT FEEDBACK */}
      <Card>
        <Text style={styles.sectionTitle}>
          Send feedback
        </Text>

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

      {/* MY FEEDBACK AND ADMIN REPLIES */}
      <View style={styles.historyHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            My feedback
          </Text>
          <Text style={styles.historySubtitle}>
            View your messages and replies from the administration.
          </Text>
        </View>

        <Pressable
          onPress={loadComplaints}
          disabled={loadingComplaints}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh feedback"
        >
          <Text style={styles.refreshText}>
            {loadingComplaints ? "..." : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {loadingComplaints ? (
        <Card>
          <ActivityIndicator color={C.maroon} />
          <Text style={styles.centerText}>
            Loading your feedback...
          </Text>
        </Card>
      ) : complaintError ? (
        <Card>
          <Text style={styles.errorTitle}>
            Could not load feedback
          </Text>
          <Text style={styles.bodyText}>
            {complaintError}
          </Text>
          <Button
            title="Try again"
            onPress={loadComplaints}
          />
        </Card>
      ) : complaints.length === 0 ? (
        <Card>
          <Text style={styles.centerText}>
            You haven't submitted any feedback yet.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {complaints.map((complaint) => {
            const replied = Boolean(
              complaint.admin_reply?.trim()
            );

            return (
              <Card key={complaint.id}>
                <View style={styles.complaintTitleRow}>
                  <Text style={styles.complaintTitle}>
                    {complaint.subject || "Complaint or feedback"}
                  </Text>

                  <Pill color={replied ? "#247A50" : "#9A6200"}>
                    {replied ? "Replied" : "Pending"}
                  </Pill>
                </View>

                {complaint.created_at ? (
                  <Text style={styles.dateText}>
                    Submitted: {formatDate(complaint.created_at)}
                  </Text>
                ) : null}

                <Text style={styles.messageLabel}>
                  Your message
                </Text>

                <Text style={styles.bodyText}>
                  {complaint.message || "No message provided."}
                </Text>

                {replied ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyTitle}>
                      Reply from administration
                    </Text>

                    <Text style={styles.replyMessage}>
                      {complaint.admin_reply}
                    </Text>

                    {complaint.replied_at ? (
                      <Text style={styles.replyDate}>
                        Replied on {formatDate(complaint.replied_at)}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.pendingBox}>
                    <Text style={styles.pendingText}>
                      Your feedback is awaiting a response from the
                      administration.
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    fontSize: 20,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },
  sectionTitle: {
    color: C.maroon,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 12,
    gap: 10,
  },
  historySubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  refreshButton: {
    backgroundColor: C.maroon,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  refreshText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  complaintTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  complaintTitle: {
    flex: 1,
    color: C.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  dateText: {
    color: C.muted,
    fontSize: 11,
    marginTop: 7,
  },
  messageLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    color: C.ink,
    fontSize: 13,
    lineHeight: 20,
  },
  replyBox: {
    backgroundColor: "#EAF6EE",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  replyTitle: {
    color: "#247A50",
    fontSize: 13,
    fontWeight: "800",
  },
  replyMessage: {
    color: C.ink,
    fontSize: 13,
    lineHeight: 20,
  },
  replyDate: {
    color: "#247A50",
    fontSize: 11,
    marginTop: 3,
  },
  pendingBox: {
    backgroundColor: "#FFF5E5",
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  pendingText: {
    color: "#895A0A",
    fontSize: 12,
    lineHeight: 18,
  },
  centerText: {
    color: C.muted,
    textAlign: "center",
    marginTop: 8,
  },
  errorTitle: {
    color: "#B00020",
    fontWeight: "800",
    marginBottom: 6,
  },
});
