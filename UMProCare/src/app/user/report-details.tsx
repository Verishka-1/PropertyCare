import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Pill, Button } from "../../components/Kit";
import {
  getMyReportDetail,
  getStorageUrl,
} from "../../services/api";

type Photo = {
  id: number;
  url?: string;
  photo_path?: string;
};

type RepairUpdate = {
  id: number;
  status: string;
  notes: string | null;
  created_at: string;
};

type RelatedBuilding =
  | {
      id?: number;
      building_id?: string;
      name?: string;
    }
  | string
  | null;

type RelatedRoom =
  | {
      id?: number;
      room_id?: string;
      name?: string;
    }
  | string
  | null;

type ReportDetail = {
  id: number;
  report_number: string;

  title?: string;

  description: string;

  building_name?: string | null;
  room_name?: string | null;

  building?: RelatedBuilding;
  room?: RelatedRoom;

  building_id?: number | string | null;
  room_id?: number | string | null;

  status: string;
  priority?: string;
  created_at: string;

  photos?: Photo[];
  repairUpdates?: RepairUpdate[];
};

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  verified: "IN PROGRESS",
  assigned: "ASSIGNED",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  rejected: "REJECTED",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#247A50",
  verified: "#245A91",
  assigned: "#245A91",
  in_progress: "#245A91",
  rejected: "#B00020",
};

/*
|--------------------------------------------------------------------------
| PROGRESS STEPS
|--------------------------------------------------------------------------
|
| The report has three main progress stages:
|
| 1. Submitted
| 2. In Progress
| 3. Repaired
|
| verified / assigned / in_progress all belong
| to the middle "In Progress" stage.
|
*/

const PROGRESS_STEPS = [
  {
    key: "pending",
    label: "Submitted",
    description: "Your report has been submitted.",
  },
  {
    key: "verified",
    label: "In Progress",
    description:
      "Your report has been accepted and is being handled.",
  },
  {
    key: "completed",
    label: "Repaired",
    description:
      "The reported issue has been repaired.",
  },
];

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

function DetailsHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text style={styles.headerSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| BUILDING NAME
|--------------------------------------------------------------------------
*/

function getBuildingName(
  report: ReportDetail
): string {
  /*
   * Direct API field:
   *
   * building_name: "Old Building"
   */
  if (
    typeof report.building_name === "string" &&
    report.building_name.trim()
  ) {
    return report.building_name.trim();
  }

  /*
   * Laravel relationship:
   *
   * building: {
   *   name: "Old Building"
   * }
   */
  if (
    report.building &&
    typeof report.building === "object" &&
    typeof report.building.name === "string" &&
    report.building.name.trim()
  ) {
    return report.building.name.trim();
  }

  /*
   * Relationship returned directly as string.
   */
  if (
    typeof report.building === "string" &&
    report.building.trim()
  ) {
    return report.building.trim();
  }

  return "Building unavailable";
}

/*
|--------------------------------------------------------------------------
| ROOM NAME
|--------------------------------------------------------------------------
*/

function getRoomName(
  report: ReportDetail
): string {
  /*
   * Direct API field:
   *
   * room_name: "302"
   */
  if (
    typeof report.room_name === "string" &&
    report.room_name.trim()
  ) {
    return report.room_name.trim();
  }

  /*
   * Laravel relationship:
   *
   * room: {
   *   name: "302"
   * }
   */
  if (
    report.room &&
    typeof report.room === "object" &&
    typeof report.room.name === "string" &&
    report.room.name.trim()
  ) {
    return report.room.name.trim();
  }

  /*
   * Relationship returned directly as string.
   */
  if (
    typeof report.room === "string" &&
    report.room.trim()
  ) {
    return report.room.trim();
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| PHOTO URL
|--------------------------------------------------------------------------
*/

function getPhotoUrl(
  photo: Photo
): string | null {
  const rawPath =
    photo.url ||
    photo.photo_path ||
    "";

  if (!rawPath) {
    return null;
  }

  return getStorageUrl(rawPath);
}

/*
|--------------------------------------------------------------------------
| MAIN SCREEN
|--------------------------------------------------------------------------
*/

export default function ReportDetailsScreen() {
  const { id, returnTo } =
    useLocalSearchParams<{
      id?: string;
      returnTo?: string;
    }>();

  const [report, setReport] =
    useState<ReportDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Currently selected photo for
   * full-screen viewing.
   */
  const [selectedPhoto, setSelectedPhoto] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    if (
      returnTo === "/user/user-reports"
    ) {
      router.replace(
        "/user/user-reports" as any
      );
      return;
    }

    if (
      returnTo === "/user/notifications"
    ) {
      router.replace(
        "/user/notifications" as any
      );
      return;
    }

    if (
      returnTo === "/user/report-history"
    ) {
      router.replace(
        "/user/report-history" as any
      );
      return;
    }

    router.replace(
      "/user/user-dashboard" as any
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD REPORT
  |--------------------------------------------------------------------------
  */

  const loadReport =
    useCallback(async () => {
      if (!id) {
        setError(
          "No report was specified."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getMyReportDetail(id);

        console.log(
          "REPORT DETAIL RESPONSE:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        console.log(
          "BUILDING NAME:",
          data?.building_name
        );

        console.log(
          "BUILDING OBJECT:",
          data?.building
        );

        console.log(
          "ROOM NAME:",
          data?.room_name
        );

        console.log(
          "ROOM OBJECT:",
          data?.room
        );

        console.log(
          "BUILDING ID:",
          data?.building_id
        );

        console.log(
          "ROOM ID:",
          data?.room_id
        );

        console.log(
          "PHOTO DATA:",
          JSON.stringify(
            data?.photos,
            null,
            2
          )
        );

        setReport(data);
      } catch (err: any) {
        console.log(
          "REPORT DETAIL ERROR:",
          err
        );

        setError(
          err?.message ||
            "Could not load this report."
        );
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <Page>
        <DetailsHeader
          title="Report details"
          subtitle="Loading..."
          onBack={handleBack}
        />

        <Card>
          <ActivityIndicator
            color={C.maroon}
          />
        </Card>
      </Page>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error || !report) {
    return (
      <Page>
        <DetailsHeader
          title="Report details"
          subtitle="Unable to load report"
          onBack={handleBack}
        />

        <Card>
          <Text
            style={{
              color: "#B00020",
              marginBottom: 16,
            }}
          >
            {error ||
              "Report not found."}
          </Text>

          <Button
            title="Try again"
            outline
            onPress={loadReport}
          />
        </Card>
      </Page>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const buildingName =
    getBuildingName(report);

  const roomName =
    getRoomName(report);

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const normalizedStatus =
    String(
      report.status || ""
    ).toLowerCase();

  /*
   * Convert all middle statuses to
   * the same progress step.
   *
   * pending      -> 0
   * verified     -> 1
   * assigned     -> 1
   * in_progress  -> 1
   * completed    -> 2
   */
  let currentStepIndex = 0;

  if (
    normalizedStatus === "verified" ||
    normalizedStatus === "assigned" ||
    normalizedStatus ===
      "in_progress"
  ) {
    currentStepIndex = 1;
  }

  if (
    normalizedStatus ===
    "completed"
  ) {
    currentStepIndex = 2;
  }

  if (
    normalizedStatus ===
    "rejected"
  ) {
    currentStepIndex = -1;
  }

  /*
  |--------------------------------------------------------------------------
  | PHOTOS
  |--------------------------------------------------------------------------
  */

  const photos =
    Array.isArray(report.photos)
      ? report.photos
      : [];

  /*
  |--------------------------------------------------------------------------
  | REPAIR UPDATES
  |--------------------------------------------------------------------------
  */

  const repairUpdates =
    Array.isArray(
      report.repairUpdates
    )
      ? report.repairUpdates
      : [];

  /*
  |--------------------------------------------------------------------------
  | PROGRESS STATUS TEXT
  |--------------------------------------------------------------------------
  */

  let progressStatusText =
    "SUBMITTED";

  if (
    normalizedStatus ===
      "verified" ||
    normalizedStatus ===
      "assigned" ||
    normalizedStatus ===
      "in_progress"
  ) {
    progressStatusText =
      "IN PROGRESS";
  }

  if (
    normalizedStatus ===
    "completed"
  ) {
    progressStatusText =
      "COMPLETED";
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Page>
      {/* ================================================================
          HEADER
      ================================================================= */}

      <DetailsHeader
        title={
          report.report_number ||
          "Report details"
        }
        subtitle="Track your report"
        onBack={handleBack}
      />

      {/* ================================================================
          REPORT SUMMARY
      ================================================================= */}

      <Card>
        <View
          style={styles.reportTopRow}
        >
          <View
            style={
              styles.locationContainer
            }
          >
            <Text
              style={
                styles.locationTitle
              }
              numberOfLines={2}
            >
              {buildingName}
            </Text>

            {roomName ? (
              <Text
                style={styles.roomName}
                numberOfLines={1}
              >
                {roomName}
              </Text>
            ) : null}
          </View>

          <Pill
            color={
              STATUS_COLORS[
                normalizedStatus
              ] ?? C.maroon
            }
          >
            {STATUS_LABELS[
              normalizedStatus
            ] ??
              normalizedStatus
                .replaceAll(
                  "_",
                  " "
                )
                .toUpperCase()}
          </Pill>
        </View>

        <Text
          style={styles.description}
        >
          {report.description ||
            "No description provided."}
        </Text>

        <Text
          style={
            styles.submittedDate
          }
        >
          Submitted{" "}
          {report.created_at
            ? new Date(
                report.created_at
              ).toLocaleDateString()
            : "Date unavailable"}
        </Text>
      </Card>

      {/* ================================================================
          PHOTOS
      ================================================================= */}

      {photos.length > 0 && (
        <Card>
          <Text
            style={styles.sectionTitle}
          >
            Photos submitted
          </Text>

          <Text
            style={
              styles.photoDescription
            }
          >
            Tap a photo to view it full
            screen.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.photosRow
            }
          >
            {photos.map((photo) => {
              const photoUrl =
                getPhotoUrl(photo);

              if (!photoUrl) {
                return null;
              }

              return (
                <Pressable
                  key={photo.id}
                  onPress={() => {
                    console.log(
                      "OPENING PHOTO:",
                      photoUrl
                    );

                    setSelectedPhoto(
                      photoUrl
                    );
                  }}
                  style={({
                    pressed,
                  }) => [
                    styles.photoPressable,
                    pressed &&
                      styles.photoPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="View photo full screen"
                >
                  <Image
                    source={{
                      uri: photoUrl,
                    }}
                    style={
                      styles.photo
                    }
                    resizeMode="cover"
                    onLoad={() => {
                      console.log(
                        "PHOTO LOADED:",
                        photoUrl
                      );
                    }}
                    onError={(
                      event
                    ) => {
                      console.log(
                        "PHOTO LOAD ERROR:",
                        photoUrl,
                        event
                          .nativeEvent
                      );
                    }}
                  />

                  <Text
                    style={
                      styles.photoHint
                    }
                  >
                    Tap to view
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>
      )}

      {/* ================================================================
          NO PHOTOS
      ================================================================= */}

      {photos.length === 0 && (
        <Card>
          <Text
            style={styles.sectionTitle}
          >
            Photos submitted
          </Text>

          <Text
            style={styles.noPhotosText}
          >
            No photos were submitted
            with this report.
          </Text>
        </Card>
      )}

      {/* ================================================================
          IMPROVED PROGRESS
      ================================================================= */}

      <Card>
        {/* Progress header */}
        <View
          style={
            styles.progressHeader
          }
        >
          <View
            style={
              styles.progressHeaderText
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Report progress
            </Text>

            <Text
              style={
                styles.progressSubtitle
              }
            >
              Track the status of your
              report
            </Text>
          </View>

          {normalizedStatus !==
            "rejected" && (
            <View
              style={
                styles.progressBadge
              }
            >
              <Text
                style={
                  styles.progressBadgeText
                }
              >
                {progressStatusText}
              </Text>
            </View>
          )}
        </View>

        {/* Rejected */}
        {normalizedStatus ===
        "rejected" ? (
          <View
            style={
              styles.rejectedProgress
            }
          >
            <View
              style={
                styles.rejectedIcon
              }
            >
              <Text
                style={
                  styles.rejectedIconText
                }
              >
                !
              </Text>
            </View>

            <View
              style={
                styles.rejectedContent
              }
            >
              <Text
                style={
                  styles.rejectedTitle
                }
              >
                Report not accepted
              </Text>

              <Text
                style={
                  styles.rejectedDescription
                }
              >
                This report was reviewed
                and could not be
                accepted.
              </Text>
            </View>
          </View>
        ) : (
          /*
           * Timeline
           */
          <View
            style={styles.timeline}
          >
            {PROGRESS_STEPS.map(
              (step, index) => {
                const reached =
                  currentStepIndex >=
                  index;

                const isCurrent =
                  currentStepIndex ===
                  index;

                const isLast =
                  index ===
                  PROGRESS_STEPS.length -
                    1;

                return (
                  <View
                    key={step.key}
                    style={
                      styles.timelineItem
                    }
                  >
                    {/* LEFT SIDE */}
                    <View
                      style={
                        styles.timelineLeft
                      }
                    >
                      {/* CONNECTING LINE */}
                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor:
                                currentStepIndex >
                                index
                                  ? C.maroon
                                  : "#E7DEE2",
                            },
                          ]}
                        />
                      )}

                      {/* STEP CIRCLE */}
                      <View
                        style={[
                          styles.timelineCircle,
                          reached &&
                            styles.timelineCircleReached,
                          isCurrent &&
                            styles.timelineCircleCurrent,
                        ]}
                      >
                        {reached &&
                        !isCurrent ? (
                          <Text
                            style={
                              styles.checkIcon
                            }
                          >
                            ✓
                          </Text>
                        ) : (
                          <Text
                            style={[
                              styles.stepNumber,
                              reached &&
                                styles.stepNumberReached,
                            ]}
                          >
                            {index + 1}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* RIGHT SIDE */}
                    <View
                      style={[
                        styles.timelineContent,
                        isCurrent &&
                          styles.timelineContentCurrent,
                      ]}
                    >
                      <View
                        style={
                          styles.timelineTitleRow
                        }
                      >
                        <Text
                          style={[
                            styles.timelineTitle,
                            reached &&
                              styles.timelineTitleReached,
                            isCurrent &&
                              styles.timelineTitleCurrent,
                          ]}
                        >
                          {step.label}
                        </Text>

                        {isCurrent && (
                          <View
                            style={
                              styles.currentIndicator
                            }
                          >
                            <Text
                              style={
                                styles.currentIndicatorText
                              }
                            >
                              CURRENT
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.timelineDescription,
                          reached &&
                            styles.timelineDescriptionReached,
                        ]}
                      >
                        {
                          step.description
                        }
                      </Text>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}
      </Card>

      {/* ================================================================
          UPDATES
      ================================================================= */}

      {repairUpdates.length >
        0 && (
        <Card>
          <Text
            style={styles.sectionTitle}
          >
            Updates
          </Text>

          {repairUpdates.map(
            (update) => {
              const updateStatus =
                update.status
                  ?.toLowerCase() ??
                "";

              return (
                <View
                  key={update.id}
                  style={
                    styles.updateItem
                  }
                >
                  <Text
                    style={
                      styles.updateStatus
                    }
                  >
                    {STATUS_LABELS[
                      updateStatus
                    ] ??
                      updateStatus
                        .replaceAll(
                          "_",
                          " "
                        )
                        .toUpperCase()}
                  </Text>

                  {update.notes ? (
                    <Text
                      style={
                        styles.updateNotes
                      }
                    >
                      {update.notes}
                    </Text>
                  ) : null}

                  <Text
                    style={
                      styles.updateDate
                    }
                  >
                    {update.created_at
                      ? new Date(
                          update.created_at
                        ).toLocaleString()
                      : "Date unavailable"}
                  </Text>
                </View>
              );
            }
          )}
        </Card>
      )}

      {/* ================================================================
          FULL-SCREEN PHOTO VIEWER
      ================================================================= */}

      <Modal
        visible={
          selectedPhoto !== null
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setSelectedPhoto(null)
        }
      >
        <View
          style={
            styles.viewerContainer
          }
        >
          {/* CLOSE BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.viewerCloseButton,
              pressed &&
                styles.viewerCloseButtonPressed,
            ]}
            onPress={() =>
              setSelectedPhoto(null)
            }
            accessibilityRole="button"
            accessibilityLabel="Close full-screen photo"
            hitSlop={10}
          >
            <Text
              style={
                styles.viewerCloseText
              }
            >
              ×
            </Text>
          </Pressable>

          {/* FULL PHOTO */}
          {selectedPhoto ? (
            <Image
              source={{
                uri: selectedPhoto,
              }}
              style={
                styles.fullScreenPhoto
              }
              resizeMode="contain"
              onLoad={() => {
                console.log(
                  "FULL-SCREEN PHOTO LOADED:",
                  selectedPhoto
                );
              }}
              onError={(event) => {
                console.log(
                  "FULL-SCREEN PHOTO ERROR:",
                  selectedPhoto,
                  event.nativeEvent
                );
              }}
            />
          ) : null}
        </View>
      </Modal>
    </Page>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backButtonPressed: {
    opacity: 0.8,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 42,
    marginTop: -4,
    fontWeight: "400",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: C.ink,
    fontSize: 24,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 3,
  },

  /*
  |--------------------------------------------------------------------------
  | REPORT SUMMARY
  |--------------------------------------------------------------------------
  */

  reportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  locationContainer: {
    flex: 1,
    minWidth: 0,
  },

  locationTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
  },

  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.muted,
    marginTop: 4,
  },

  description: {
    color: C.ink,
    lineHeight: 20,
    marginTop: 14,
  },

  submittedDate: {
    color: C.muted,
    fontSize: 12,
    marginTop: 10,
  },

  /*
  |--------------------------------------------------------------------------
  | GENERAL
  |--------------------------------------------------------------------------
  */

  sectionTitle: {
    fontWeight: "800",
    color: C.ink,
  },

  /*
  |--------------------------------------------------------------------------
  | PHOTOS
  |--------------------------------------------------------------------------
  */

  photoDescription: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 8,
  },

  photosRow: {
    gap: 10,
    paddingTop: 4,
  },

  photoPressable: {
    width: 150,
    marginRight: 4,
  },

  photoPressed: {
    opacity: 0.75,
  },

  photo: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#F0ECEE",
  },

  photoHint: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
  },

  noPhotosText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 8,
  },

  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  progressHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  progressSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },

  progressBadge: {
    backgroundColor: "#F6E7EC",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },

  progressBadgeText: {
    color: C.maroon,
    fontSize: 10,
    fontWeight: "800",
  },

  /*
  |--------------------------------------------------------------------------
  | TIMELINE
  |--------------------------------------------------------------------------
  */

  timeline: {
    paddingTop: 2,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 82,
  },

  timelineLeft: {
    width: 42,
    alignItems: "center",
    position: "relative",
  },

  timelineLine: {
    position: "absolute",
    top: 34,
    bottom: -2,
    width: 2,
  },

  timelineCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEE7EA",
    borderWidth: 2,
    borderColor: "#E1D7DB",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  timelineCircleReached: {
    backgroundColor: C.maroon,
    borderColor: C.maroon,
  },

  timelineCircleCurrent: {
    backgroundColor: "#FFFFFF",
    borderColor: C.maroon,
    borderWidth: 3,
  },

  stepNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A99BA0",
  },

  stepNumberReached: {
    color: C.maroon,
  },

  checkIcon: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 17,
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 22,
    paddingTop: 1,
  },

  timelineContentCurrent: {
    backgroundColor: "#FBF5F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },

  timelineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9B8E94",
    flexShrink: 1,
  },

  timelineTitleReached: {
    color: C.ink,
  },

  timelineTitleCurrent: {
    color: C.maroon,
    fontWeight: "800",
  },

  timelineDescription: {
    color: "#B1A5AA",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  timelineDescriptionReached: {
    color: C.muted,
  },

  currentIndicator: {
    backgroundColor: C.maroon,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  currentIndicatorText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  /*
  |--------------------------------------------------------------------------
  | REJECTED
  |--------------------------------------------------------------------------
  */

  rejectedProgress: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4F5",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3D4D8",
  },

  rejectedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#B00020",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rejectedIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  rejectedContent: {
    flex: 1,
  },

  rejectedTitle: {
    color: "#B00020",
    fontSize: 14,
    fontWeight: "800",
  },

  rejectedDescription: {
    color: "#8D6F75",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATES
  |--------------------------------------------------------------------------
  */

  updateItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAED",
    paddingVertical: 8,
  },

  updateStatus: {
    fontWeight: "700",
    color: C.ink,
  },

  updateNotes: {
    color: C.muted,
  },

  updateDate: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },

  /*
  |--------------------------------------------------------------------------
  | FULL-SCREEN PHOTO VIEWER
  |--------------------------------------------------------------------------
  */

  viewerContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenPhoto: {
    width: "100%",
    height: "100%",
  },

  viewerCloseButton: {
    position: "absolute",
    zIndex: 10,
    top: 48,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      "rgba(50, 50, 50, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerCloseButtonPressed: {
    opacity: 0.7,
  },

  viewerCloseText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "300",
    marginTop: -3,
  },
});