import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Button } from "../../components/Kit";
import {
  getAdminUsers,
  toggleBanUser,
} from "../../services/api";

type UserAccount = {
  id: number;
  name: string;
  username: string;
  email: string;
  contact_number?: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
  damage_reports_count?: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

export default function AdminUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<UserAccount | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers();

      // Keep admin accounts hidden from user management.
      const nonAdminUsers = (data || []).filter(
        (user: UserAccount) =>
          String(user.role).toLowerCase() !== "admin"
      );

      setUsers(nonAdminUsers);
    } catch (err: any) {
      setError(err?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.contact_number
          ?.toLowerCase()
          .includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  async function applyBanToggle(user: UserAccount) {
    try {
      setSaving(true);

      const updated = await toggleBanUser(
        user.id,
        !user.is_banned
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...(updated || {}),
                is_banned:
                  updated?.is_banned ??
                  !item.is_banned,
              }
            : item
        )
      );

      setSelected((current) =>
        current && current.id === user.id
          ? {
              ...current,
              ...(updated || {}),
              is_banned:
                updated?.is_banned ??
                !current.is_banned,
            }
          : current
      );

      Alert.alert(
        "Success",
        user.is_banned
          ? "User has been unbanned."
          : "User has been banned."
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message || "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmBanToggle(user: UserAccount) {
    const action = user.is_banned ? "unban" : "ban";

    Alert.alert(
      user.is_banned ? "Unban user?" : "Ban user?",
      user.is_banned
        ? `Are you sure you want to unban ${user.name}?`
        : `Are you sure you want to ban ${user.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text:
            action === "ban"
              ? "Ban"
              : "Unban",
          style:
            action === "ban"
              ? "destructive"
              : "default",
          onPress: () => applyBanToggle(user),
        },
      ]
    );
  }

  return (
    <Page>
      {/* Header */}
      <View style={styles.customHeader}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            User management
          </Text>

          <Text style={styles.headerSubtitle}>
            Search users and ban or unban accounts
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>
          USER ACCOUNTS
        </Text>

        <Card style={styles.searchCard}>
          <Text style={styles.searchLabel}>
            Search users
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Name, username, email, contact..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        {/* Loading */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={C.maroon}
            />

            <Text style={styles.stateText}>
              Loading users...
            </Text>
          </View>
        ) : error ? (
          /* Error */
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>
              Unable to load users
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadUsers}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : filteredUsers.length === 0 ? (
          /* Empty */
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>
              No users found
            </Text>

            <Text style={styles.emptyText}>
              {search.trim()
                ? "Try using a different search term."
                : "There are no registered users yet."}
            </Text>
          </View>
        ) : (
          <>
            {/* Account count */}
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1
                  ? "user"
                  : "users"}
              </Text>

              {search.trim() ? (
                <Text style={styles.countSubtext}>
                  matching your search
                </Text>
              ) : null}
            </View>

            {/* User list */}
            <View style={styles.userList}>
              {filteredUsers.map((user) => (
                <Pressable
                  key={user.id}
                  onPress={() => setSelected(user)}
                  style={({ pressed }) => [
                    styles.userCard,
                    pressed && styles.userCardPressed,
                  ]}
                >
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      user.is_banned &&
                        styles.avatarBanned,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        user.is_banned &&
                          styles.avatarTextBanned,
                      ]}
                    >
                      {initials(user.name) || "U"}
                    </Text>
                  </View>

                  {/* User information */}
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={styles.userName}
                        numberOfLines={1}
                      >
                        {user.name}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          user.is_banned
                            ? styles.bannedBadge
                            : styles.activeBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            user.is_banned
                              ? styles.bannedText
                              : styles.activeText,
                          ]}
                        >
                          {user.is_banned
                            ? "Banned"
                            : "Active"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.username}
                      numberOfLines={1}
                    >
                      @{user.username}
                    </Text>

                    <Text
                      style={styles.email}
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        {user.role}
                      </Text>

                      <View
                        style={styles.metaDot}
                      />

                      <Text style={styles.metaText}>
                        Joined{" "}
                        {formatDate(user.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {/* User Details Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selected ? (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalAvatar,
                      selected.is_banned &&
                        styles.avatarBanned,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalAvatarText,
                        selected.is_banned &&
                          styles.avatarTextBanned,
                      ]}
                    >
                      {initials(selected.name) ||
                        "U"}
                    </Text>
                  </View>

                  <View style={styles.modalTitleArea}>
                    <Text
                      style={styles.modalTitle}
                      numberOfLines={2}
                    >
                      {selected.name}
                    </Text>

                    <Text
                      style={styles.modalUsername}
                    >
                      @{selected.username}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setSelected(null)}
                    style={styles.closeButton}
                    hitSlop={8}
                  >
                    <Text style={styles.closeButtonText}>
                      ×
                    </Text>
                  </Pressable>
                </View>

                {/* Status */}
                <View
                  style={[
                    styles.modalStatus,
                    selected.is_banned
                      ? styles.modalStatusBanned
                      : styles.modalStatusActive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      selected.is_banned
                        ? styles.statusDotBanned
                        : styles.statusDotActive,
                    ]}
                  />

                  <Text
                    style={[
                      styles.modalStatusText,
                      selected.is_banned
                        ? styles.modalStatusTextBanned
                        : styles.modalStatusTextActive,
                    ]}
                  >
                    {selected.is_banned
                      ? "This account is currently banned"
                      : "This account is currently active"}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <DetailRow
                    label="Email"
                    value={selected.email}
                  />

                  <DetailRow
                    label="Contact number"
                    value={
                      selected.contact_number || "—"
                    }
                  />

                  <DetailRow
                    label="Role"
                    value={selected.role}
                  />

                  <DetailRow
                    label="Joined"
                    value={formatDate(
                      selected.created_at
                    )}
                  />

                  <DetailRow
                    label="Damage reports"
                    value={String(
                      selected.damage_reports_count ??
                        0
                    )}
                  />
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <Button
                    title={
                      selected.is_banned
                        ? "Unban User"
                        : "Ban User"
                    }
                    onPress={() =>
                      confirmBanToggle(selected)
                    }
                    disabled={saving}
                  />

                  <Pressable
                    onPress={() => setSelected(null)}
                    style={styles.cancelButton}
                  >
                    <Text
                      style={styles.cancelButtonText}
                    >
                      Close
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  /* =========================
     HEADER
  ========================= */

  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 30,
    marginBottom: 6,
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

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
    marginTop: -3,
  },

  headerTextContainer: {
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

  /* =========================
     CONTENT
  ========================= */

  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  sectionLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 9,
  },

  /* =========================
     SEARCH
  ========================= */

  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
  },

  searchLabel: {
    color: C.maroon,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  searchInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 10,
    paddingHorizontal: 13,
    color: "#222222",
    backgroundColor: "#FAFAFA",
    fontSize: 14,
  },

  /* =========================
     COUNT
  ========================= */

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  countText: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "800",
  },

  countSubtext: {
    color: C.muted,
    fontSize: 12,
    marginLeft: 7,
  },

  /* =========================
     USER CARD
  ========================= */

  userList: {
    gap: 10,
  },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  userCardPressed: {
    opacity: 0.75,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F4E5E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarBanned: {
    backgroundColor: "#F0F0F0",
  },

  avatarText: {
    color: C.maroon,
    fontSize: 15,
    fontWeight: "800",
  },

  avatarTextBanned: {
    color: "#777777",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  userName: {
    flex: 1,
    color: "#202020",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },

  username: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 2,
  },

  email: {
    color: "#555555",
    fontSize: 12,
    marginBottom: 7,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    color: "#888888",
    fontSize: 10.5,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#AAAAAA",
    marginHorizontal: 6,
  },

  arrow: {
    color: C.maroon,
    fontSize: 26,
    fontWeight: "300",
    marginLeft: 6,
  },

  /* =========================
     STATUS BADGES
  ========================= */

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  activeBadge: {
    backgroundColor: "#EAF6EE",
  },

  bannedBadge: {
    backgroundColor: "#F5E8E8",
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: "800",
  },

  activeText: {
    color: "#287A43",
  },

  bannedText: {
    color: C.maroon,
  },

  /* =========================
     STATES
  ========================= */

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
    paddingHorizontal: 20,
  },

  stateText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 10,
  },

  errorTitle: {
    color: C.maroon,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  errorText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  emptyTitle: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  retryButton: {
    backgroundColor: C.maroon,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 15,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  /* =========================
     MODAL
  ========================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  modalAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F4E5E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  modalAvatarText: {
    color: C.maroon,
    fontSize: 17,
    fontWeight: "800",
  },

  modalTitleArea: {
    flex: 1,
  },

  modalTitle: {
    color: "#202020",
    fontSize: 17,
    fontWeight: "800",
  },

  modalUsername: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#555555",
    fontSize: 25,
    fontWeight: "300",
    lineHeight: 28,
    marginTop: -2,
  },

  modalStatus: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },

  modalStatusActive: {
    backgroundColor: "#EAF6EE",
  },

  modalStatusBanned: {
    backgroundColor: "#F5E8E8",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusDotActive: {
    backgroundColor: "#287A43",
  },

  statusDotBanned: {
    backgroundColor: C.maroon,
  },

  modalStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },

  modalStatusTextActive: {
    color: "#287A43",
  },

  modalStatusTextBanned: {
    color: C.maroon,
  },

  /* =========================
     DETAILS
  ========================= */

  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingVertical: 5,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    gap: 15,
  },

  detailLabel: {
    color: "#888888",
    fontSize: 12,
    flex: 0.9,
  },

  detailValue: {
    color: "#222222",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    flex: 1.4,
  },

  /* =========================
     MODAL ACTIONS
  ========================= */

  modalActions: {
    marginTop: 18,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },

  cancelButtonText: {
    color: C.maroon,
    fontSize: 13,
    fontWeight: "800",
  },
});