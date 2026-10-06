import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import { C } from "../../constants/palette";
import { Page, Header, Card, Button, Pill } from "../../components/Kit";
import { getAdminComplaints, replyToComplaint } from "../../services/api";

type Complaint = {
  id: number;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at?: string | null;
  user?: {
    name?: string;
    email?: string;
    contact_number?: string | null;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

/**
 * Complaints & feedback.
 * The admin writes a reply here; it is saved and shows up in the sender's
 * notification bell inside the app (no email app needed).
 */
export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // which complaint has its reply box open, and what is typed in it
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      setComplaints((await getAdminComplaints()) as Complaint[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load complaints."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const openReply = (complaint: Complaint) => {
    setReplyingId(complaint.id);
    setReplyText(complaint.admin_reply ?? "");
  };

  const closeReply = () => {
    setReplyingId(null);
    setReplyText("");
  };

  const sendReply = async (complaint: Complaint) => {
    const text = replyText.trim();

    if (!text) {
      Alert.alert("Reply is empty", "Please write your reply first.");
      return;
    }

    try {
      setSending(true);

      const updated = (await replyToComplaint(complaint.id, text)) as Complaint;

      setComplaints((current) =>
        current.map((row) =>
          row.id === complaint.id ? { ...row, ...updated } : row
        )
      );

      closeReply();

      Alert.alert(
        "Reply sent",
        "The user will see your reply in their notifications."
      );
    } catch (err) {
      Alert.alert(
        "Could not send reply",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSending(false);
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
            <ActivityIndicator color={C.maroon} />
            <Text style={{ color: C.muted, textAlign: "center" }}>
              Loading complaints...
            </Text>
          </Card>
        ) : error ? (
          <Card>
            <Text style={{ color: "#B00020", fontWeight: "700" }}>
              Could not load complaints
            </Text>
            <Text style={{ color: C.muted }}>{error}</Text>
            <Button title="Try again" onPress={loadComplaints} />
          </Card>
        ) : complaints.length === 0 ? (
          <Card>
            <Text style={{ color: C.muted, textAlign: "center" }}>
              No complaints or feedback have been submitted yet.
            </Text>
          </Card>
        ) : (
          complaints.map((complaint) => {
            const replied = Boolean(complaint.admin_reply);
            const isReplying = replyingId === complaint.id;

            return (
              <Card key={complaint.id}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 15,
                      color: C.ink,
                      flex: 1,
                    }}
                  >
                    {complaint.subject || "Complaint or feedback"}
                  </Text>

                  <Pill color={replied ? "#247A50" : "#9A6200"}>
                    {replied ? "Replied" : "Open"}
                  </Pill>
                </View>

                <Text style={{ color: C.muted, fontSize: 12 }}>
                  {complaint.user?.name ?? "Campus user"}
                  {complaint.user?.contact_number
                    ? ` · ${complaint.user.contact_number}`
                    : ""}
                  {complaint.created_at
                    ? ` · ${formatDate(complaint.created_at)}`
                    : ""}
                </Text>

                <Text style={{ color: C.ink, lineHeight: 20 }}>
                  {complaint.message || "No message provided."}
                </Text>

                {replied && !isReplying ? (
                  <View
                    style={{
                      backgroundColor: C.greenSoft,
                      borderRadius: 10,
                      padding: 12,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: C.green,
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      Your reply
                      {complaint.replied_at
                        ? ` · ${formatDate(complaint.replied_at)}`
                        : ""}
                    </Text>

                    <Text style={{ color: C.ink, lineHeight: 20 }}>
                      {complaint.admin_reply}
                    </Text>
                  </View>
                ) : null}

                {isReplying ? (
                  <View style={{ gap: 10 }}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Write your reply to the user..."
                      placeholderTextColor={C.muted}
                      multiline
                      textAlignVertical="top"
                      maxLength={2000}
                      editable={!sending}
                      style={{
                        minHeight: 100,
                        borderWidth: 1,
                        borderColor: C.line,
                        borderRadius: 10,
                        padding: 12,
                        color: C.ink,
                        fontSize: 14,
                      }}
                    />

                    {sending ? (
                      <ActivityIndicator color={C.maroon} />
                    ) : (
                      <>
                        <Button
                          title="Send reply"
                          onPress={() => sendReply(complaint)}
                        />
                        <Button title="Cancel" outline onPress={closeReply} />
                      </>
                    )}
                  </View>
                ) : (
                  <Button
                    title={replied ? "Edit reply" : "Reply to user"}
                    outline={replied}
                    onPress={() => openReply(complaint)}
                  />
                )}
              </Card>
            );
          })
        )}
      </View>
    </Page>
  );
}
