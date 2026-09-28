import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { COLORS, Spacing } from "../../constants/theme";
import { getMyProfile, logout } from "../../services/api";

type UserProfile = {
  name?: string;
  email?: string;
};

export default function UserDashboardScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setProfileLoading(true);
    }

    try {
      const response = await getMyProfile();
      setProfile(response?.data ?? response ?? null);
    } catch (error) {
      console.warn("Could not load user profile:", error);
    } finally {
      setProfileLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchProfile = async () => {
        try {
          const response = await getMyProfile();
          if (active) {
            setProfile(response?.data ?? response ?? null);
          }
        } catch (error) {
          console.warn("Could not load user profile:", error);
        } finally {
          if (active) {
            setProfileLoading(false);
          }
        }
      };

      fetchProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  const handleRefresh = () => {
    loadProfile(true);
  };

  const handleLogout = () => {
    if (loggingOut) return;

    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);

          try {
            await logout();
            router.replace("/login");
          } catch (error: any) {
            Alert.alert(
              "Logout failed",
              error?.message || "Please try again."
            );
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const goToReportForm = () => {
    goToTab("/user/select-room");
  };

  const goToTab = (path: string) => {
    router.navigate(path as any);
  };

  const firstName = profile?.name?.trim()?.split(/\s+/)[0];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.maroon}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>PC</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                loggingOut && styles.disabledButton,
              ]}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              {loggingOut ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.logoutText}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.smallTitle}>SCHOOL PROPERTY CARE</Text>

          <Text style={styles.headerTitle}>
            {profileLoading
              ? "Welcome!"
              : firstName
                ? `Hello, ${firstName}!`
                : "Welcome!"}
          </Text>

          <Text style={styles.headerSubtitle}>
            Help keep our campus safe, functional, and well-maintained.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Main action */}
          <View style={styles.mainActionCard}>
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionIcon}>＋</Text>
            </View>

            <Text style={styles.mainActionEyebrow}>NOTICE SOMETHING DAMAGED?</Text>
            <Text style={styles.mainActionTitle}>Report property damage</Text>
            <Text style={styles.mainActionDescription}>
              Let the administration know about damaged or malfunctioning
              school property.
            </Text>

            <TouchableOpacity
              style={styles.mainActionButton}
              onPress={goToReportForm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start a property damage report"
            >
              <Text style={styles.mainActionButtonText}>
                Start a report
              </Text>
              <Text style={styles.buttonArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Reports navigation */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your activity</Text>
              <Text style={styles.sectionSubtitle}>
                Follow up on reports you’ve submitted.
              </Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <TouchableOpacity
              style={styles.activityRow}
              onPress={() => goToTab("/user/user-reports")}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.activityIconBox}>
                <Text style={styles.activityIcon}>▤</Text>
              </View>

              <View style={styles.activityTextBlock}>
                <Text style={styles.activityTitle}>My Reports</Text>
                <Text style={styles.activityDescription}>
                  Check the status of your submissions.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.activityRow}
              onPress={() => router.push("/user/report-history")}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.activityIconBox}>
                <Text style={styles.activityIcon}>◷</Text>
              </View>

              <View style={styles.activityTextBlock}>
                <Text style={styles.activityTitle}>Report History</Text>
                <Text style={styles.activityDescription}>
                  Review completed and resolved reports.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Explore campus */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Explore and connect</Text>
              <Text style={styles.sectionSubtitle}>
                Find campus locations or send feedback.
              </Text>
            </View>
          </View>

          <View style={styles.exploreGrid}>
            <TouchableOpacity
              style={styles.exploreCard}
              onPress={() => goToTab("/user/campus-map")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={[styles.exploreIconCircle, styles.mapIconCircle]}>
                <Text style={styles.exploreIcon}>⌖</Text>
              </View>
              <Text style={styles.exploreTitle}>Campus Map</Text>
              <Text style={styles.exploreDescription}>
                Browse buildings and campus locations.
              </Text>
              <Text style={styles.exploreLink}>Open map ›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exploreCard}
              onPress={() => goToTab("/user/feedback")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View
                style={[styles.exploreIconCircle, styles.feedbackIconCircle]}
              >
                <Text style={styles.exploreIcon}>✉</Text>
              </View>
              <Text style={styles.exploreTitle}>Feedback</Text>
              <Text style={styles.exploreDescription}>
                Share a comment or concern with the administration.
              </Text>
              <Text style={styles.exploreLink}>Send feedback ›</Text>
            </TouchableOpacity>
          </View>

          {/* How it works */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>How reporting works</Text>
              <Text style={styles.sectionSubtitle}>
                Three simple steps to submit a report.
              </Text>
            </View>
          </View>

          <View style={styles.stepsCard}>
            <Step
              number="01"
              title="Choose a location"
              description="Select the building and room where the damage happened."
              isLast={false}
            />
            <Step
              number="02"
              title="Describe the problem"
              description="Provide details about the damaged property and issue."
              isLast={false}
            />
            <Step
              number="03"
              title="Submit and follow up"
              description="Send your report, then check its status in My Reports."
              isLast
            />
          </View>

          {/* Account shortcut */}
          <TouchableOpacity
            style={styles.settingsShortcut}
            onPress={() => goToTab("/user/user-settings")}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.settingsShortcutText}>
              <Text style={styles.settingsShortcutTitle}>Profile & Settings</Text>
              <Text style={styles.settingsShortcutDescription}>
                Manage your account information and preferences.
              </Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Thank you for helping care for our campus.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

type StepProps = {
  number: string;
  title: string;
  description: string;
  isLast: boolean;
};

function Step({ number, title, description, isLast }: StepProps) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumberColumn}>
        <View style={styles.stepNumberCircle}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        {!isLast && <View style={styles.stepConnector} />}
      </View>

      <View style={styles.stepTextBlock}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.lighterMaroon,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },

  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 54,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 30,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 13,
    minWidth: 64,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  smallTitle: {
    color: "#EED5DC",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 7,
  },

  headerSubtitle: {
    color: "#F6E9ED",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 310,
  },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  mainActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 25,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F7E9EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  actionIcon: {
    color: COLORS.maroon,
    fontSize: 26,
    fontWeight: "500",
    lineHeight: 29,
  },

  mainActionEyebrow: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  mainActionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 5,
  },

  mainActionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  mainActionButton: {
    marginTop: 17,
    backgroundColor: COLORS.maroon,
    borderRadius: 10,
    minHeight: 45,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mainActionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  buttonArrow: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 25,
    marginTop: -2,
  },

  sectionHeader: {
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.md,
    marginBottom: 25,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingVertical: 11,
  },

  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F7E9EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activityIcon: {
    color: COLORS.maroon,
    fontSize: 21,
    fontWeight: "700",
  },

  activityTextBlock: {
    flex: 1,
  },

  activityTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  activityDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  rowArrow: {
    color: COLORS.maroon,
    fontSize: 25,
    marginLeft: 8,
  },

  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  exploreGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  exploreCard: {
    width: "48.3%",
    minHeight: 175,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
  },

  exploreIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  mapIconCircle: {
    backgroundColor: "#E8F1EA",
  },

  feedbackIconCircle: {
    backgroundColor: "#F7E9EE",
  },

  exploreIcon: {
    color: COLORS.maroon,
    fontSize: 21,
    fontWeight: "700",
  },

  exploreTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  exploreDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    flex: 1,
  },

  exploreLink: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 12,
  },

  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 5,
    marginBottom: 18,
  },

  stepRow: {
    flexDirection: "row",
    minHeight: 72,
  },

  stepNumberColumn: {
    width: 40,
    alignItems: "center",
    marginRight: 11,
  },

  stepNumberCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#F7E9EE",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    color: COLORS.maroon,
    fontSize: 9,
    fontWeight: "900",
  },

  stepConnector: {
    width: 1,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  stepTextBlock: {
    flex: 1,
    paddingBottom: 16,
  },

  stepTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },

  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  settingsShortcut: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingsShortcutText: {
    flex: 1,
    paddingRight: 8,
  },

  settingsShortcutTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  settingsShortcutDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  footerNote: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
    marginBottom: 8,
  },
});