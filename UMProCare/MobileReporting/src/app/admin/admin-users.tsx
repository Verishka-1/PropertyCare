import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Text,
  TextInput,
  View,
} from "react-native";

import { C } from "../../constants/palette";
import { Page, Header, Card } from "../../components/Kit";
import { deleteUser, getAdminUsers, toggleBanUser } from "../../services/api";

type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_banned: boolean;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await getAdminUsers();
      setUsers(rows);
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
      `${user.name} ${user.email} ${user.role}`
        .toLowerCase()
        .includes(term)
    );
  }, [users, search]);

  const handleBanToggle = async (user: UserAccount) => {
    try {
      await toggleBanUser(user.id);
      await loadUsers();
    } catch (err) {
      Alert.alert(
        "Action failed",
        err instanceof Error ? err.message : "Could not update this account."
      );
    }
  };

  const handleDelete = (user: UserAccount) => {
    Alert.alert(
      "Delete account",
      `This permanently deletes ${user.name}'s account. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(user.id);
              await loadUsers();
            } catch (err) {
              Alert.alert(
                "Delete failed",
                err instanceof Error ? err.message : "Could not delete this account."
              );
            }
          },
        },
      ]
    );
  };

  const handleEmail = (user: UserAccount) => {
    Linking.openURL(`mailto:${user.email}`).catch(() => {
      Alert.alert(
        "Could not open email",
        "No email app appears to be available on this device."
      );
    });
  };

  const showManageOptions = (user: UserAccount) => {
    if (user.role === "admin") {
      Alert.alert("Administrator account", "The admin account cannot be managed from here.");
      return;
    }

    Alert.alert(
      user.name,
      `${user.email}\nRole: ${user.role}\nStatus: ${user.is_banned ? "Banned" : "Active"}`,
      [
        { text: "Email user", onPress: () => handleEmail(user) },
        {
          text: user.is_banned ? "Unban user" : "Ban user",
          onPress: () => handleBanToggle(user),
        },
        { text: "Delete account", style: "destructive", onPress: () => handleDelete(user) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <Page>
      <Header
        title="User management"
        sub="Search and manage accounts"
        back
      />

      <Card>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, or role"
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
            style={{
              color: C.maroon,
              fontWeight: "800",
              marginTop: 12,
            }}
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
              ? "Try a different name, email, or role."
              : "Registered accounts will appear here."}
          </Text>
        </Card>
      ) : (
        filteredUsers.map((user) => (
          <Card
            key={user.id}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
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
              <Text
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                {user.role} · {user.email}
                {user.is_banned ? " · BANNED" : ""}
              </Text>
            </View>

            <Text
              onPress={() => showManageOptions(user)}
              accessibilityRole="button"
              style={{ color: C.maroon, fontWeight: "800", marginLeft: 8 }}
            >
              Manage
            </Text>
          </Card>
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
    </Page>
  );
}