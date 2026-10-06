import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { COLORS, Spacing } from "../constants/theme";
import { getAdminReports } from "../services/api";

type Report = {
  id: number;
  report_number: string;
  title?: string | null;
  property_name?: string | null;
  description?: string | null;
  building_name?: string | null;
  room_name?: string | null;
  status: string;
  priority?: string | null;
  created_at?: string | null;
};

type FilterKey =
  | "all"
  | "pending"
  | "verified"
  | "in_progress"
  | "completed"
  | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Accepted" },
  { key: "in_progress", label: "Under repair" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> =
  {
    pending: { label: "Pending", color: "#9A6200", bg: "#FFF3D9" },
    verified: { label: "Accepted", color: "#245A91", bg: "#E8F0FE" },
    in_progress: { label: "Under repair", color: "#6B3FA0", bg: "#F1E9FB" },
    completed: { label: "Completed", color: "#247A50", bg: "#E7F4EC" },
    rejected: { label: "Rejected", color: "#B00020", bg: "#FFEBEE" },
  };

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

/**
 * LIST VIEW of the Report Map screen.
 *
 * Shows every report (newest first) with filters:
 *   - status chips (All / Pending / Accepted / Under repair / ...)
 *   - building chips
 *   - search box (report number, property, room, building, description)
 * Tap a card to open the report details (accept / reject / repair / complete).
 */
export default function AdminReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<FilterKey>("all");
  const [building, setBuilding] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setReports(await getAdminReports());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: reports.length };

    reports.forEach((report) => {
      result[report.status] = (result[report.status] ?? 0) + 1;
    });

    return result;
  }, [reports]);

  const buildings = useMemo(() => {
    const names = new Set<string>();

    reports.forEach((report) => {
      if (report.building_name) names.add(report.building_name);
    });

    return Array.from(names).sort();
  }, [reports]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports.filter((report) => {
      if (status !== "all" && report.status !== status) return false;
      if (building !== "all" && report.building_name !== building) return false;

      if (!term) return true;

      return [
        report.report_number,
        report.title,
        report.property_name,
        report.building_name,
        report.room_name,
        report.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [reports, status, building, search]);

  const openReport = (report: Report) => {
    router.push({
      pathname: "/admin/admin-report-details",
      params: { id: String(report.id) },
    } as any);
  };

  const clearFilters = () => {
    setStatus("all");
    setBuilding("all");
    setSearch("");
  };

  const filtersActive = status !== "all" || building !== "all" || search !== "";

  return (
    <View style={styles.container}>
      {/* ---------- search + filters ---------- */}
      <View style={styles.filterArea}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search report no., room, building..."
          placeholderTextColor={COLORS.gray}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {FILTERS.map((filter) => {
            const selected = status === filter.key;

            return (
              <Pressable
                key={filter.key}
                onPress={() => setStatus(filter.key)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {filter.label} ({counts[filter.key] ?? 0})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {buildings.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {["all", ...buildings].map((name) => {
              const selected = building === name;

              return (
                <Pressable
                  key={name}
                  onPress={() => setBuilding(name)}
                  style={[
                    styles.chip,
                    styles.buildingChip,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {name === "all" ? "All buildings" : name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {loading ? "Loading..." : `${visible.length} report(s)`}
          </Text>

          {filtersActive ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ---------- list ---------- */}
      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.maroon}
            colors={[COLORS.maroon]}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.maroon} />
            <Text style={styles.muted}>Loading reports...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Could not load reports</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                load();
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.muted}>
              {filtersActive
                ? "Try a different filter or clear the search."
                : "No damage reports have been submitted yet."}
            </Text>
          </View>
        ) : (
          visible.map((report) => {
            const info = STATUS_INFO[report.status] ?? {
              label: report.status,
              color: COLORS.maroon,
              bg: COLORS.lightMaroon,
            };

            return (
              <Pressable
                key={report.id}
                onPress={() => openReport(report)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`Open report ${report.report_number}`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.reportNumber}>{report.report_number}</Text>

                  <View style={[styles.badge, { backgroundColor: info.bg }]}>
                    <Text style={[styles.badgeText, { color: info.color }]}>
                      {info.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {report.title || report.property_name || "Damage report"}
                </Text>

                <Text style={styles.cardLocation}>
                  {report.building_name}
                  {report.room_name ? ` • ${report.room_name}` : ""}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>
                    {formatDate(report.created_at)}
                    {report.priority
                      ? `  •  ${report.priority.toUpperCase()} priority`
                      : ""}
                  </Text>

                  <Text style={styles.cardLink}>Details ›</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lighterMaroon },

  filterArea: {
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  search: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontSize: 13,
  },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.maroon,
    backgroundColor: COLORS.white,
  },
  buildingChip: { borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.maroon, borderColor: COLORS.maroon },
  chipText: { color: COLORS.maroon, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: COLORS.white },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultText: { color: COLORS.textSecondary, fontSize: 12 },
  clearText: { color: COLORS.maroon, fontSize: 12, fontWeight: "800" },

  list: { padding: Spacing.lg, paddingBottom: 40, gap: 10, flexGrow: 1 },

  center: { alignItems: "center", paddingVertical: 50, gap: 8 },
  muted: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center" },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  errorTitle: { color: COLORS.maroon, fontSize: 15, fontWeight: "800" },
  retry: {
    marginTop: 8,
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: COLORS.white, fontWeight: "700" },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportNumber: { color: COLORS.maroon, fontSize: 12, fontWeight: "800" },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginTop: 2 },
  cardLocation: { color: COLORS.textSecondary, fontSize: 12 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardDate: { color: COLORS.gray, fontSize: 11 },
  cardLink: { color: COLORS.maroon, fontSize: 12, fontWeight: "800" },
});
