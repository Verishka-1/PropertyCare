/**
 * Central API client for the School Property Damage Reporting app.
 *
 * Every network call the app makes goes through this file so that:
 *  - the auth token and base URL are handled in exactly one place
 *  - every screen gets consistent error messages
 *  - it's obvious, at a glance, what the backend actually offers
 *
 * Screens should import the named helper functions below rather than
 * calling apiRequest()/fetch() directly wherever possible.
 */
import * as SecureStore from "expo-secure-store";

// TODO: point this at your machine's LAN IP while developing with Expo Go
// (Windows: `ipconfig`, macOS/Linux: `ifconfig`) - "localhost" only works
// from a simulator running on the same machine as the Laravel server.
const API_URL = "http://192.168.254.118:8000/api";

const TOKEN_KEY = "auth_token";

/* ------------------------------------------------------------------ */
/*  Low-level request helper                                          */
/* ------------------------------------------------------------------ */

type ApiOptions = RequestInit & { isFormData?: boolean };

export async function apiRequest(path: string, options: ApiOptions = {}) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const { isFormData, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...rest, headers });
  } catch (networkError) {
    throw new Error(
      `Could not reach the server at ${API_URL}${path}. Reason: ${String(networkError)}`
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Laravel validation errors come back as { errors: { field: [msg] } }.
    const firstValidationError = result?.errors
      ? (Object.values(result.errors)[0] as string[])?.[0]
      : null;

    throw new Error(
      firstValidationError || result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: "student" | "teacher";
  password: string;
  password_confirmation: string;
};

export async function register(payload: RegisterPayload) {
  return apiRequest("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(loginId: string, password: string, expoPushToken?: string) {
  const result = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({
      login: loginId,
      password,
      device_name: "Expo Mobile App",
      expo_push_token: expoPushToken,
    }),
  });

  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  return result.user;
}

export async function logout() {
  try {
    await apiRequest("/logout", { method: "POST" });
  } finally {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function getMyProfile() {
  return apiRequest("/me");
}

export async function updateMyProfile(payload: {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
}) {
  const result = await apiRequest("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result?.data ?? result;
}

export async function registerPushToken(expoPushToken: string) {
  return apiRequest("/user/push-token", {
    method: "POST",
    body: JSON.stringify({ expo_push_token: expoPushToken }),
  });
}

/* ------------------------------------------------------------------ */
/*  Locations (Select Room screen)                                    */
/* ------------------------------------------------------------------ */

export async function getLocations() {
  const result = await apiRequest("/locations");
  return result?.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Damage reports (student/teacher side)                             */
/* ------------------------------------------------------------------ */

export async function submitReport(payload: {
  building_name: string;
  room_name?: string;
  description: string;
  photoUris?: string[]; // local file:// URIs from the camera/gallery picker
}) {
  const form = new FormData();
  form.append("building_name", payload.building_name);
  if (payload.room_name) form.append("room_name", payload.room_name);
  form.append("description", payload.description);

  const photoUris = payload.photoUris ?? [];

  for (let index = 0; index < photoUris.length; index++) {
    const uri = photoUris[index];
    const fileName = uri.split("/").pop() || `photo-${index}.jpg`;

    // Convert the local file into a real Blob instead of using the
    // older { uri, name, type } shorthand - some React Native / Expo
    // versions reject that shorthand with "Unsupported FormDataPart
    // implementation". Fetching the local file and reading it as a
    // blob works reliably across versions.
    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    form.append("photos[]", blob, fileName);
  }

  return apiRequest("/reports", {
    method: "POST",
    body: form,
    isFormData: true,
  });
}
export async function getMyReports() {
  const result = await apiRequest("/my/reports");
  return result?.data ?? [];
}

export async function getMyReportDetail(reportId: number | string) {
  const result = await apiRequest(`/my/reports/${reportId}`);
  return result?.data ?? result;
}

export async function getMyReportHistory() {
  const result = await apiRequest("/my/reports/history");
  return result?.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Complaints / feedback                                             */
/* ------------------------------------------------------------------ */

export async function submitComplaint(subject: string, message: string) {
  return apiRequest("/complaints", {
    method: "POST",
    body: JSON.stringify({ subject, message }),
  });
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                     */
/* ------------------------------------------------------------------ */

export async function getNotifications() {
  return apiRequest("/notifications");
}

export async function markNotificationRead(id: number) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}

/* ------------------------------------------------------------------ */
/*  Admin: dashboard & map                                            */
/* ------------------------------------------------------------------ */

export async function getAdminDashboard() {
  return apiRequest("/admin/dashboard");
}

export async function getAdminCampusCounts() {
  return apiRequest("/admin/campus-counts");
}

export async function getAdminMapCounts() {
  return apiRequest("/admin/map/counts");
}

export async function getAdminBuildingCounts(building: string) {
  return apiRequest(`/admin/building-map/counts?building=${encodeURIComponent(building)}`);
}

export async function getAdminRoomReports(building?: string, room?: string) {
  const params = new URLSearchParams();
  if (building) params.set("building", building);
  if (room) params.set("room", room);
  const suffix = params.toString();

  const result = await apiRequest(`/admin/map/room-reports${suffix ? `?${suffix}` : ""}`);
  return result?.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Admin: reports                                                    */
/* ------------------------------------------------------------------ */

export async function getAdminReports(status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  const result = await apiRequest(`/admin/reports${suffix}`);
  return result?.data ?? [];
}

export async function getAdminReportDetail(reportId: number | string) {
  const result = await apiRequest(`/admin/reports/${reportId}`);
  return result?.data ?? result;
}

export async function updateAdminReportStatus(
  reportId: number | string,
  status: "verified" | "rejected" | "completed",
  notes?: string
) {
  const result = await apiRequest(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
  return result?.data ?? result;
}

/* ------------------------------------------------------------------ */
/*  Admin: users                                                      */
/* ------------------------------------------------------------------ */

export async function getAdminUsers(search?: string) {
  const suffix = search ? `?q=${encodeURIComponent(search)}` : "";
  const result = await apiRequest(`/admin/users${suffix}`);
  return result?.data ?? [];
}

export async function toggleBanUser(userId: number) {
  const result = await apiRequest(`/admin/users/${userId}/ban`, { method: "PATCH" });
  return result?.data ?? result;
}

export async function deleteUser(userId: number) {
  return apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  Admin: complaints                                                  */
/* ------------------------------------------------------------------ */

export async function getAdminComplaints() {
  const result = await apiRequest("/admin/complaints");
  return result?.data ?? [];
}
