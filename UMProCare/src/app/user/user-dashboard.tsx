import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { COLORS } from "../../constants/theme";
import { getMyProfile } from "../../services/api";

type UserProfile = {
  first_name?: string;
  last_name?: string;
  name?: string;
  username?: string;
};

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getMyProfile();
      const user = response?.data?.user ?? response?.data ?? response?.user ?? response;

      setProfile(user);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const getDisplayName = () => {
    if (profile?.first_name?.trim()) {
      return profile.first_name.trim();
    }

    if (profile?.name?.trim()) {
      return profile.name.trim().split(" ")[0];
    }

    if (profile?.username?.trim()) {
      return profile.username.trim();
    }

    return "Student";
  };

  const getFullName = () => {
    const firstName = profile?.first_name?.trim() ?? "";
    const lastName = profile?.last_name?.trim() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || profile?.name?.trim() || profile?.username?.trim() || "Student";
  };

  const getInitials = () => {
    const name = getFullName();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name.slice(0, 1).toUpperCase();
  };

  const goToReportForm = () => {
    router.navigate("/user/report-damage" as any);
  };

  const goToCampusMap = () => {
    router.navigate("/user/campus-map" as any);
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>PC</Text>
        </View>
        <ActivityIndicator
          size="small"
          color={COLORS.maroon}
          style={styles.loadingSpinner}
        />
        <Text style={styles.loadingText}>Getting your dashboard ready...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
          tintColor={COLORS.maroon}
          colors={[COLORS.maroon]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>PC</Text>
            </View>
            <View>
              <Text style={styles.brandName}>PROPERTY CARE</Text>
              <Text style={styles.brandCaption}>SCHOOL REPORTING</Text>
            </View>
          </View>

          <View style={styles.headerTag}>
            <View style={styles.headerTagDot} />
            <Text style={styles.headerTagText}>STUDENT</Text>
          </View>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeEyebrow}>WELCOME BACK</Text>
          <Text style={styles.welcomeTitle}>
            Hello, {getDisplayName()}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Let’s keep our campus safe, clean, and in good condition.
          </Text>
        </View>

        <View style={styles.headerDecoration} />
        <View style={styles.headerDecorationSmall} />
      </View>

      {/* User profile strip */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>

        <View style={styles.profileText}>
          <Text style={styles.profileOverline}>SIGNED IN AS</Text>
          <Text style={styles.profileName} numberOfLines={1}>
            {getFullName()}
          </Text>
        </View>

        <View style={styles.profileCheck}>
          <Text style={styles.profileCheckText}>✓</Text>
        </View>
      </View>

      {/* Main action */}
      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>QUICK ACTION</Text>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportCard}
          onPress={goToReportForm}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Start a damage report"
        >
          <View style={styles.reportCardTop}>
            <View style={styles.reportIconCircle}>
              <Text style={styles.reportIcon}>＋</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>NEW REPORT</Text>
            </View>
          </View>

          <Text style={styles.reportTitle}>Report damaged property</Text>
          <Text style={styles.reportDescription}>
            Help us identify and address damage around the school.
          </Text>

          <View style={styles.reportCardFooter}>
            <Text style={styles.reportButtonText}>Start a report</Text>
            <View style={styles.reportArrowCircle}>
              <Text style={styles.reportArrow}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Campus map */}
      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>FIND A LOCATION</Text>
            <Text style={styles.sectionTitle}>Explore campus</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.mapCard}
                        onPress={() =>
                  router.push({
                    pathname: "/user/campus-map",
                    params: {
                      returnTo: "/user/user-dashboard",
                    },
                  } as any)
                }
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Open campus map"
        >
          <View style={styles.mapIllustration}>
            <View style={styles.mapGridLineOne} />
            <View style={styles.mapGridLineTwo} />
            <View style={styles.mapGridLineThree} />
            <View style={styles.mapPinOuter}>
              <Text style={styles.mapPin}>⌖</Text>
            </View>
          </View>

          <View style={styles.mapContent}>
            <Text style={styles.mapTitle}>Campus Map</Text>
            <Text style={styles.mapDescription}>
              Browse buildings and choose the room where the issue is located.
            </Text>
            <View style={styles.mapLinkRow}>
              <Text style={styles.mapLinkText}>Open map</Text>
              <Text style={styles.mapLinkArrow}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>A SIMPLE PROCESS</Text>
            <Text style={styles.sectionTitle}>How reporting works</Text>
          </View>
        </View>

        <View style={styles.stepsCard}>
          <View style={styles.stepRow}>
            <View style={styles.stepMarkerColumn}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <View style={styles.stepConnector} />
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose a location</Text>
              <Text style={styles.stepDescription}>
                Select the building and room where you found the damage.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepMarkerColumn}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>02</Text>
              </View>
              <View style={styles.stepConnector} />
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Describe the issue</Text>
              <Text style={styles.stepDescription}>
                Provide details and attach photos that help explain the damage.
              </Text>
            </View>
          </View>

          <View style={[styles.stepRow, styles.lastStepRow]}>
            <View style={styles.stepMarkerColumn}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>03</Text>
              </View>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Submit your report</Text>
              <Text style={styles.stepDescription}>
                Send it for review and follow its progress from your reports tab.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRule} />
        <Text style={styles.footerTitle}>PROPERTY CARE</Text>
        <Text style={styles.footerCaption}>
          Taking care of our school, together.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F5F7",
  },

  contentContainer: {
    paddingBottom: 34,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F5F7",
    paddingHorizontal: 24,
  },

  loadingLogo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogoText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  loadingSpinner: {
    marginTop: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#77717A",
    fontSize: 13,
  },

  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 50,
    paddingHorizontal: 22,
    paddingBottom: 42,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  brandIconText: {
    color: COLORS.maroon,
    fontSize: 15,
    fontWeight: "900",
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  brandCaption: {
    color: "#E8C9D1",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginTop: 3,
  },

  headerTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  headerTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F4D6A0",
    marginRight: 6,
  },

  headerTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  welcomeBlock: {
    marginTop: 34,
    zIndex: 1,
  },

  welcomeEyebrow: {
    color: "#EACFD6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 9,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 9,
  },

  welcomeSubtitle: {
    color: "#F6E9EC",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 290,
  },

  headerDecoration: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    right: -78,
    bottom: -70,
  },

  headerDecorationSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    right: -20,
    bottom: -40,
  },

  profileCard: {
    marginHorizontal: 20,
    marginTop: -20,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#24121A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    zIndex: 2,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F4E8EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: COLORS.maroon,
    fontSize: 16,
    fontWeight: "900",
  },

  profileText: {
    flex: 1,
  },

  profileOverline: {
    color: "#9A9298",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  profileName: {
    color: "#29242A",
    fontSize: 14,
    fontWeight: "800",
  },

  profileCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EAF4ED",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCheckText: {
    color: "#398452",
    fontSize: 13,
    fontWeight: "900",
  },

  section: {
    marginTop: 28,
    marginHorizontal: 20,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: COLORS.maroon,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  sectionTitle: {
    color: "#29242A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  reportCard: {
    backgroundColor: COLORS.maroon,
    borderRadius: 22,
    padding: 19,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#4A0C20",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  reportCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },

  reportIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  reportIcon: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 31,
    marginTop: -2,
  },

  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  actionBadgeText: {
    color: "#F9E8ED",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  reportTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 7,
  },

  reportDescription: {
    color: "#F5E6EA",
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 285,
  },

  reportCardFooter: {
    marginTop: 20,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  reportArrowCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  reportArrow: {
    color: COLORS.maroon,
    fontSize: 23,
    lineHeight: 25,
    marginTop: -2,
  },

  mapCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EEE9EC",
    elevation: 1,
    shadowColor: "#24121A",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  mapIllustration: {
    width: 94,
    height: 106,
    borderRadius: 15,
    backgroundColor: "#F5ECEF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  mapGridLineOne: {
    position: "absolute",
    width: 120,
    height: 1,
    backgroundColor: "#E6D4DA",
    transform: [{ rotate: "35deg" }],
  },

  mapGridLineTwo: {
    position: "absolute",
    width: 120,
    height: 1,
    backgroundColor: "#E6D4DA",
    transform: [{ rotate: "-35deg" }],
  },

  mapGridLineThree: {
    position: "absolute",
    width: 1,
    height: 130,
    backgroundColor: "#E6D4DA",
    transform: [{ rotate: "18deg" }],
  },

  mapPinOuter: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#4A0C20",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  mapPin: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 31,
  },

  mapContent: {
    flex: 1,
    paddingVertical: 3,
  },

  mapTitle: {
    color: "#29242A",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  mapDescription: {
    color: "#77717A",
    fontSize: 11,
    lineHeight: 17,
  },

  mapLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  mapLinkText: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: "900",
  },

  mapLinkArrow: {
    color: COLORS.maroon,
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },

  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: "#EEE9EC",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 75,
  },

  lastStepRow: {
    minHeight: 65,
  },

  stepMarkerColumn: {
    width: 39,
    alignItems: "center",
  },

  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#F4E8EB",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 27,
    backgroundColor: "#EADDE1",
    marginTop: 5,
    marginBottom: 4,
  },

  stepContent: {
    flex: 1,
    paddingLeft: 9,
    paddingBottom: 17,
  },

  stepTitle: {
    color: "#29242A",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 5,
  },

  stepDescription: {
    color: "#77717A",
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    alignItems: "center",
    marginTop: 31,
    paddingHorizontal: 20,
  },

  footerRule: {
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#D9C1C9",
    marginBottom: 13,
  },

  footerTitle: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 5,
  },

  footerCaption: {
    color: "#A19AA0",
    fontSize: 11,
  },
});