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

// The server address lives in src/constants/config.ts - edit it THERE.
import { API_URL } from "../constants/config";

/**
 * Convert any photo address coming from Laravel into one this phone can
 * reach RIGHT NOW.
 *
 * Laravel may write "http://localhost/...", an old IP address, or just a
 * path. Whatever host it was, we keep only the path (/media/... or
 * /storage/...) and put it on the server address from constants/config.ts.
 */
export const getStorageUrl = (path: string) => {
  if (!path) {
    return path;
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, "");

  if (/^https?:\/\//i.test(path)) {
    const rest = path.replace(/^https?:\/\/[^/]+/i, "");

    if (rest.startsWith("/media/") || rest.startsWith("/storage/")) {
      return `${baseUrl}${rest}`;
    }

    return path;
  }

  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }

  // bare storage path such as "damage-reports/abc.jpg"
  return `${baseUrl}/media/${path}`;
};

const TOKEN_KEY = "auth_token";

/* ------------------------------------------------------------------ */
/*  Low-level request helper                                          */
/* ------------------------------------------------------------------ */

type ApiOptions = RequestInit & {
  isFormData?: boolean;
};

export async function apiRequest(
  path: string,
  options: ApiOptions = {}
) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const { isFormData, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",

    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers as Record<string, string>),
  };

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
    });
  } catch (networkError) {
    throw new Error(
      `Could not reach the server at ${API_URL}${path}. Reason: ${String(
        networkError
      )}`
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Laravel validation errors come back as:
    // {
    //   errors: {
    //     field: ["message"]
    //   }
    // }

    const firstValidationError = result?.errors
      ? (Object.values(result.errors)[0] as string[])?.[0]
      : null;

    throw new Error(
      firstValidationError ||
        result.message ||
        `Request failed (${response.status})`
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
  contact_number: string;
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

export async function login(
  loginId: string,
  password: string
) {
  const result = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({
      login: loginId,
      password,
      device_name: "Expo Mobile App",
    }),
  });

  await SecureStore.setItemAsync(TOKEN_KEY, result.token);

  return result.user;
}

export async function logout() {
  try {
    await apiRequest("/logout", {
      method: "POST",
    });
  } finally {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

/* ------------------------------------------------------------------ */
/*  User profile                                                       */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/profile
 *
 * Gets the currently logged-in user's profile.
 */
export async function getMyProfile() {
  return apiRequest("/user/profile");
}

/**
 * PATCH /api/user/profile
 *
 * Updates the currently logged-in user's:
 * - first name
 * - last name
 * - username
 * - email
 * - contact number
 */
export async function updateMyProfile(payload: {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  contact_number?: string;
}) {
  const result = await apiRequest("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  // ProfileController returns:
  //
  // {
  //   message: "...",
  //   data: {...}
  // }
  //
  // Return only the profile to the settings screen.
  return result?.data ?? result;
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

/**
 * One photo picked from the camera / gallery.
 *
 * `base64` comes straight from expo-image-picker (`base64: true`), so the
 * photo is sent inside the normal JSON request. This is what fixed the
 * "photo.0 must be an image" error on Android - no multipart / Blob
 * handling is involved any more, so it behaves the same on Android and iOS.
 */
export type ReportPhoto = {
  uri: string;
  base64: string;
  mimeType?: string;
};

export async function submitReport(payload: {
  building_name: string;
  room_name: string;
  description: string;
  photos?: ReportPhoto[];
}) {
  return apiRequest("/reports", {
    method: "POST",
    body: JSON.stringify({
      building_name: payload.building_name,
      room_name: payload.room_name,
      description: payload.description,
      photos: (payload.photos ?? []).map(
        (photo) =>
          `data:${photo.mimeType || "image/jpeg"};base64,${photo.base64}`
      ),
    }),
  });
}

export async function getMyReports() {
  const result = await apiRequest("/my/reports");

  return result?.data ?? [];
}

export async function getMyReportDetail(
  reportId: number | string
) {
  const result = await apiRequest(
    `/my/reports/${reportId}`
  );

  return result?.data ?? result;
}

export async function getMyReportHistory() {
  const result = await apiRequest(
    "/my/reports/history"
  );

  return result?.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Complaints / feedback                                             */
/* ------------------------------------------------------------------ */

export async function submitComplaint(
  subject: string,
  message: string
) {
  return apiRequest("/complaints", {
    method: "POST",
    body: JSON.stringify({
      subject,
      message,
    }),
  });
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                     */
/* ------------------------------------------------------------------ */

export async function getNotifications() {
  return apiRequest("/notifications");
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await apiRequest("/notifications/unread-count");

  return Number(result?.unread_count ?? 0);
}

export async function markNotificationRead(
  id: number
) {
  return apiRequest(
    `/notifications/${id}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsRead() {
  return apiRequest(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );
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

export async function getAdminBuildingCounts(
  building: string
) {
  return apiRequest(
    `/admin/building-map/counts?building=${encodeURIComponent(
      building
    )}`
  );
}

export async function getAdminRoomReports(
  building?: string,
  room?: string
) {
  const params = new URLSearchParams();

  if (building) {
    params.set("building", building);
  }

  if (room) {
    params.set("room", room);
  }

  const suffix = params.toString();

  const result = await apiRequest(
    `/admin/map/room-reports${
      suffix ? `?${suffix}` : ""
    }`
  );

  return result?.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Admin: reports                                                    */
/* ------------------------------------------------------------------ */

export async function getAdminReports(
  status?: string
) {
  const suffix = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  const result = await apiRequest(
    `/admin/reports${suffix}`
  );

  return result?.data ?? [];
}

export async function getAdminReportDetail(
  reportId: number | string
) {
  const result = await apiRequest(
    `/admin/reports/${reportId}`
  );

  return result?.data ?? result;
}

export async function updateAdminReportStatus(
  reportId: number | string,
  status:
    | "verified"
    | "in_progress"
    | "completed"
    | "rejected",
  notes?: string
) {
  const result = await apiRequest(
    `/admin/reports/${reportId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        notes,
      }),
    }
  );

  return result?.data ?? result;
}

/* ------------------------------------------------------------------ */
/*  Admin: users                                                      */
/* ------------------------------------------------------------------ */

export async function getAdminUsers(
  search?: string
) {
  const suffix = search
    ? `?q=${encodeURIComponent(search)}`
    : "";

  const result = await apiRequest(
    `/admin/users${suffix}`
  );

  return result?.data ?? [];
}

export async function getAdminUser(userId: number) {
  const result = await apiRequest(`/admin/users/${userId}`);

  return result?.data ?? result;
}

export async function toggleBanUser(
  userId: number
) {
  const result = await apiRequest(
    `/admin/users/${userId}/ban`,
    {
      method: "PATCH",
    }
  );

  return result?.data ?? result;
}

export async function deleteUser(
  userId: number
) {
  return apiRequest(
    `/admin/users/${userId}`,
    {
      method: "DELETE",
    }
  );
}

/* ------------------------------------------------------------------ */
/*  Admin: complaints                                                 */
/* ------------------------------------------------------------------ */

export async function getAdminComplaints() {
  const result = await apiRequest(
    "/admin/complaints"
  );

  return result?.data ?? [];
}

export async function replyToComplaint(
  complaintId: number,
  reply: string
) {
  const result = await apiRequest(
    `/admin/complaints/${complaintId}/reply`,
    {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    }
  );

  return result?.data ?? result;
}
