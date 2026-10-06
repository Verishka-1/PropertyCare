import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { COLORS, Spacing } from "../../constants/theme";
import { submitReport, type ReportPhoto } from "../../services/api";

const MAX_PHOTOS = 5;

type RouteParam = string | string[] | undefined;

const getParam = (value: RouteParam): string => {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export default function ReportDamageScreen() {
 const params = useLocalSearchParams<{
  building?: string | string[];
  buildingName?: string | string[];
  room?: string | string[];
  roomName?: string | string[];
  returnTo?: string | string[];
}>();

  const returnTo = getParam(params.returnTo);

  // IDs are kept separate from the names shown to the user.
  const [selectedBuilding, setSelectedBuilding] = useState(() =>
    getParam(params.building)
  );
  const [selectedRoom, setSelectedRoom] = useState(() =>
    getParam(params.room)
  );
  const [selectedBuildingName, setSelectedBuildingName] = useState(() =>
    getParam(params.buildingName)
  );
  const [selectedRoomName, setSelectedRoomName] = useState(() =>
    getParam(params.roomName)
  );

  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Refresh the selected location when the map sends new route parameters.
  useEffect(() => {
    setSelectedBuilding(getParam(params.building));
    setSelectedRoom(getParam(params.room));
    setSelectedBuildingName(getParam(params.buildingName));
    setSelectedRoomName(getParam(params.roomName));
  }, [
    params.building,
    params.buildingName,
    params.room,
    params.roomName,
  ]);

  const chooseLocation = () => {
  router.push({
    pathname: "/user/campus-map",
    params: {
      returnTo: "/user/report-damage",
    },
  } as any);
};

  const addPhotoFrom = async (source: "camera" | "gallery") => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Photo limit reached",
        `You can attach up to ${MAX_PHOTOS} photos.`
      );
      return;
    }

    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          source === "camera"
            ? "Camera access is required to take a photo of the damage."
            : "Photo library access is required to attach a photo."
        );
        return;
      }

      /*
       * `base64: true` makes the picker hand us the photo as text, so it is
       * sent inside the normal JSON request (works on Android AND iOS).
       * quality 0.5 keeps each photo small enough for a quick upload.
       */
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.5,
        base64: true,
        exif: false,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert(
            "Photo error",
            "That photo could not be read. Please try another one."
          );
          return;
        }

        const picked: ReportPhoto = {
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType ?? "image/jpeg",
        };

        setPhotos((current) => {
          if (current.length >= MAX_PHOTOS) {
            return current;
          }

          return [...current, picked];
        });
      }
    } catch (error) {
      Alert.alert(
        "Photo error",
        error instanceof Error
          ? error.message
          : "Could not open the camera or photo library."
      );
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((current) => current.filter((item) => item.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!selectedBuilding || !selectedRoom) {
      Alert.alert(
        "Location Required",
        "Please select the building and room where the damage occurred."
      );
      return;
    }

    if (!selectedBuildingName || !selectedRoomName) {
      Alert.alert(
        "Location Name Missing",
        "Please select the location again from the map so its building and room names are included."
      );
      return;
    }

    const cleanDescription = description.trim();

    if (!cleanDescription) {
      Alert.alert(
        "Description Required",
        "Please provide a short description of the damage."
      );
      return;
    }

    setSubmitting(true);

    try {
      await submitReport({
        building_name: selectedBuildingName,
        room_name: selectedRoomName,
        description: cleanDescription,
        photos,
      });

      Alert.alert(
        "Report Submitted",
        "Your damage report has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/user/user-dashboard" as any),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error instanceof Error
          ? error.message
          : "Could not submit your report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={submitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Report Damage</Text>
            <Text style={styles.headerSubtitle}>
              Report a damaged school property
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Property Location</Text>

          <Text style={styles.sectionDescription}>
            Select the building and room where the damage occurred.
          </Text>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={chooseLocation}
            activeOpacity={0.8}
            disabled={submitting}
          >
            <Text style={styles.mapButtonText}>
              {selectedBuilding && selectedRoom
                ? "Change Location"
                : "Select Location on Map"}
            </Text>
          </TouchableOpacity>

          {selectedBuilding && selectedRoom ? (
            <View style={styles.selectedLocation}>
              <Text style={styles.selectedLabel}>
                Selected Location
              </Text>

              <Text style={styles.selectedLocationText}>
                {selectedBuildingName || "Selected building"}
              </Text>

              <Text style={styles.selectedRoomText}>
                {selectedRoomName || "Room name unavailable"}
              </Text>
            </View>
          ) : (
            <View style={styles.noLocation}>
              <Text style={styles.noLocationText}>
                No location selected yet.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photos</Text>

          <Text style={styles.sectionDescription}>
            Attach up to {MAX_PHOTOS} photos of the damage (optional, but
            recommended).
          </Text>

          <View style={styles.photoRow}>
            {photos.map((photo) => (
              <View key={photo.uri} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoThumb}
                />

                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(photo.uri)}
                  disabled={submitting}
                >
                  <Text style={styles.removePhotoText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[
                styles.photoActionButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={() => addPhotoFrom("camera")}
              disabled={submitting || photos.length >= MAX_PHOTOS}
            >
              <Text style={styles.photoActionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.photoActionButton,
                styles.photoActionOutline,
              ]}
              onPress={() => addPhotoFrom("gallery")}
              disabled={submitting || photos.length >= MAX_PHOTOS}
            >
              <Text style={styles.photoActionOutlineText}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Damage Description
          </Text>

          <Text style={styles.sectionDescription}>
            Briefly describe what is damaged.
          </Text>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Example: The window is cracked and cannot close properly."
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={500}
            editable={!submitting}
          />

          <Text style={styles.characterCount}>
            {description.length}/500
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              SUBMIT DAMAGE REPORT
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighterMaroon,
  },

  scroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: Spacing.lg,
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backText: {
    color: COLORS.white,
    fontSize: 38,
    lineHeight: 42,
    marginTop: -4,
    fontWeight: "400",
  },

  headerTitle: {
    color: COLORS.maroon,
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },

  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },

  mapButton: {
    height: 48,
    backgroundColor: COLORS.maroon,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  mapButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },

  selectedLocation: {
    backgroundColor: COLORS.lightMaroon,
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.maroon,
  },

  selectedLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 3,
  },

  selectedLocationText: {
    color: COLORS.maroon,
    fontSize: 16,
    fontWeight: "800",
  },

  selectedRoomText: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 2,
  },

  noLocation: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },

  noLocationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },

  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.md,
  },

  photoWrapper: {
    position: "relative",
  },

  photoThumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: "#F0ECEE",
  },

  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },

  removePhotoText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginTop: -1,
  },

  photoActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  photoActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },

  photoActionOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.maroon,
  },

  photoActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  photoActionOutlineText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "700",
  },

  descriptionInput: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: COLORS.white,
  },

  characterCount: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: "right",
    marginTop: 5,
  },

  submitButton: {
    height: 52,
    backgroundColor: COLORS.maroon,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  cancelButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: COLORS.maroon,
    fontSize: 13,
    fontWeight: "700",
  },
});