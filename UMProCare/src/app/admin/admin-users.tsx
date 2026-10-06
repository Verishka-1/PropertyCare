import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { C } from "../../constants/palette";
import { Page, Header, Card, Button } from "../../components/Kit";
import { getAdminUsers, toggleBanUser } from "../../services/api";

type UserAccount = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  contact_number?: string | null;
  role: string;
  is_banned: boolean;
  created_at?: string | null;
  damage_reports_count?: number;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: "#F0EAED",
        gap: 12,
      }}
    >
      <Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: C.ink,
          fontSize: 13,
          fontWeight: "700",
          flexShrink: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Search users -> tap one -> details -> Ban / Unban.
 * The administrator account is never listed (the backend leaves it out).
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<UserAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const rows = (await getAdminUsers()) as UserAccount[];

      // extra safety: never show the administrator
      setUsers(rows.filter((user) => user.role !== "admin"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load user accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      `${user.name} ${user.username ?? ""} ${user.email} ${
        user.contact_number ?? ""
      } ${user.role}`
        .toLowerCase()
        .includes(term)
    );
  }, [users, search]);

  const applyBanToggle = async (user: UserAccount) => {
    try {
      setSaving(true);

      const updated = (await toggleBanUser(user.id)) as Partial<UserAccount>;
      const isBanned = Boolean(updated?.is_banned);

      setUsers((current) =>
        current.map((row) =>
          row.id === user.id ? { ...row, is_banned: isBanned } : row
        )
      );
      setSelected((current) =>
        current && current.id === user.id
          ? { ...current, is_banned: isBanned }
          : current
      );

      Alert.alert(
        isBanned ? "User banned" : "User unbanned",
        isBanned
          ? `${user.name} was signed out and can no longer log in.`
          : `${user.name} can log in again.`
      );
    } catch (err) {
      Alert.alert(
        "Action failed",
        err instanceof Error ? err.message : "Could not update this account."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmBanToggle = (user: UserAccount) => {
    const ban = !user.is_banned;

    Alert.alert(
      ban ? "Ban this user?" : "Unban this user?",
      ban
        ? `${user.name} will be signed out immediately and will not be able to log in.`
        : `${user.name} will be able to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: ban ? "Ban user" : "Unban user",
          style: ban ? "destructive" : "default",
          onPress: () => applyBanToggle(user),
        },
      ]
    );
  };

  return (
    <Page>
      <Header
        title="User management"
        sub="Search users and ban or unban accounts"
        back
      />

      <Card>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, username, email or phone"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: C.soft,
            color: C.ink,
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 11,
            fontSize: 14,
          }}
        />
      </Card>

      {loading ? (
        <Card>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <ActivityIndicator color={C.maroon} />
            <Text style={{ color: C.muted, marginTop: 8 }}>
              Loading accounts...
            </Text>
          </View>
        </Card>
      ) : error ? (
        <Card>
          <Text style={{ color: C.ink, fontWeight: "800" }}>
            Unable to load accounts
          </Text>
          <Text style={{ color: C.muted, marginTop: 5 }}>{error}</Text>
          <Text
            onPress={loadUsers}
            accessibilityRole="button"
            style={{ color: C.maroon, fontWeight: "800", marginTop: 12 }}
          >
            Try again
          </Text>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <Text style={{ color: C.ink, fontWeight: "800" }}>
            {search.trim() ? "No matching accounts" : "No user accounts"}
          </Text>
          <Text style={{ color: C.muted, marginTop: 5 }}>
            {search.trim()
              ? "Try a different name, email or phone number."
              : "Registered students and teachers will appear here."}
          </Text>
        </Card>
      ) : (
        filteredUsers.map((user) => (
          <Pressable
            key={user.id}
            onPress={() => setSelected(user)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${user.name}`}
          >
            <Card style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  backgroundColor: C.soft,
                  color: C.maroon,
                  padding: 12,
                  borderRadius: 10,
                  fontWeight: "900",
                  overflow: "hidden",
                }}
              >
                {initials(user.name)}
              </Text>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: C.ink, fontWeight: "700" }}>
                  {user.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {user.role} · {user.email}
                </Text>
              </View>

              {user.is_banned ? (
                <Text
                  style={{
                    color: "#B00020",
                    backgroundColor: "#FFEBEE",
                    fontSize: 10,
                    fontWeight: "800",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    overflow: "hidden",
                    marginRight: 8,
                  }}
                >
                  BANNED
                </Text>
              ) : null}

              <Text style={{ color: C.maroon, fontWeight: "800" }}>View ›</Text>
            </Card>
          </Pressable>
        ))
      )}

      {!loading && !error && users.length > 0 ? (
        <Text
          style={{
            color: C.muted,
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          Showing {filteredUsers.length} of {users.length} accounts
        </Text>
      ) : null}

      {/* ---------------- USER DETAILS ---------------- */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          {selected ? (
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                padding: 20,
                paddingBottom: 30,
                gap: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    backgroundColor: C.soft,
                    color: C.maroon,
                    padding: 14,
                    borderRadius: 12,
                    fontWeight: "900",
                    fontSize: 16,
                    overflow: "hidden",
                  }}
                >
                  {initials(selected.name)}
                </Text>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink, fontSize: 18, fontWeight: "800" }}>
                    {selected.name}
                  </Text>

                  <Text
                    style={{
                      color: selected.is_banned ? "#B00020" : C.green,
                      fontWeight: "800",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {selected.is_banned ? "BANNED" : "ACTIVE"}
                  </Text>
                </View>

                <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                  <Text style={{ color: C.muted, fontSize: 26 }}>×</Text>
                </Pressable>
              </View>

              <DetailRow label="Username" value={selected.username || "—"} />
              <DetailRow label="Email" value={selected.email} />
              <DetailRow
                label="Contact number"
                value={selected.contact_number || "—"}
              />
              <DetailRow
                label="Role"
                value={
                  selected.role.charAt(0).toUpperCase() + selected.role.slice(1)
                }
              />
              <DetailRow
                label="Reports submitted"
                value={String(selected.damage_reports_count ?? 0)}
              />
              <DetailRow
                label="Registered"
                value={formatDate(selected.created_at)}
              />

              <View style={{ marginTop: 14, gap: 10 }}>
                {saving ? (
                  <ActivityIndicator color={C.maroon} />
                ) : (
                  <Button
                    title={selected.is_banned ? "Unban user" : "Ban user"}
                    onPress={() => confirmBanToggle(selected)}
                  />
                )}

                <Button
                  title="Close"
                  outline
                  onPress={() => setSelected(null)}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </Page>
  );
}
