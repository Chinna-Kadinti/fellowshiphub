import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import type {
  AnnouncementsPayload,
  ApiErrorBody,
  ArrivalStatus,
  AttendanceStatus,
  AuthPayload,
  CreateMeetingInput,
  DashboardPayload,
  DirectoryPayload,
  DiscussionsPayload,
  LoginInput,
  MeetingDetailPayload,
  MeetingsPayload,
  PrayerCategory,
  PrayerPayload,
  PrayerStatus,
  PrayerVisibility,
  ReadingPayload,
  RegisterInput,
  ReportsPayload,
  ResourceType,
  ResourcesPayload,
  RsvpStatus,
  SessionPayload,
  VolunteerInput
} from "../types";

const mobileEnvironment = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env;
const configuredBaseUrl = mobileEnvironment?.VITE_API_URL?.replace(/\/+$/, "");
const API_ROOT = `${
  configuredBaseUrl ?? (import.meta.env.DEV ? "http://localhost:3000" : "")
}/api/mobile/v1`;
const missingProductionApiUrl = import.meta.env.PROD && !configuredBaseUrl;
const TOKEN_KEY = "fellowshiphub_access_token";

let tokenCache: string | null | undefined;

export const tokenStore = {
  async get() {
    if (tokenCache !== undefined) return tokenCache;
    tokenCache = await SecureStorage.getItem(TOKEN_KEY);
    return tokenCache;
  },
  async set(token: string) {
    await SecureStorage.setItem(TOKEN_KEY, token);
    tokenCache = token;
  },
  async clear() {
    tokenCache = null;
    try {
      await SecureStorage.removeItem(TOKEN_KEY);
    } catch {
      // Keep the in-memory session cleared even if the platform store is unavailable.
    }
  }
};

export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard"] as const,
  meetings: ["meetings"] as const,
  meeting: (id: string) => ["meetings", id] as const,
  announcements: ["announcements"] as const,
  resources: (search = "") => ["resources", search] as const,
  prayer: ["prayer"] as const,
  discussions: ["discussions"] as const,
  reading: ["reading"] as const,
  directory: ["directory"] as const,
  reports: ["reports"] as const
};

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  allowUnauthenticated?: boolean;
};

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (missingProductionApiUrl) {
    throw new ApiError(
      "This mobile build has no backend URL. Set VITE_API_URL and rebuild the app.",
      0
    );
  }

  const headers = new Headers(options.headers);
  const token = await tokenStore.get();
  const hasBody = options.body !== undefined;
  if (hasBody && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers,
      credentials: "include",
      body:
        options.body instanceof FormData
          ? options.body
          : options.body === undefined
            ? undefined
            : JSON.stringify(options.body)
    });
  } catch {
    throw new ApiError("You appear to be offline. Check your connection and try again.", 0);
  }

  if (response.status === 401 && !options.allowUnauthenticated) {
    window.dispatchEvent(new CustomEvent("fellowshiphub:unauthorized"));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const nestedError = typeof body.error === "object" ? body.error : undefined;
    const message =
      (typeof body.error === "string" ? body.error : nestedError?.message) ||
      body.message ||
      `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, nestedError?.details ?? body.issues);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return unwrap(JSON.parse(text) as T | { data: T });
}

export const api = {
  session: () => request<SessionPayload>("/session/me", { allowUnauthenticated: true }),
  login: (input: LoginInput) =>
    request<AuthPayload>("/auth/login", {
      method: "POST",
      body: input,
      allowUnauthenticated: true
    }),
  register: (input: RegisterInput) =>
    request<AuthPayload>("/auth/register", {
      method: "POST",
      body: input,
      allowUnauthenticated: true
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  dashboard: () => request<DashboardPayload>("/dashboard"),
  meetings: () => request<MeetingsPayload>("/meetings"),
  meeting: async (id: string): Promise<MeetingDetailPayload> => {
    const payload = await request<{ meeting: import("../types").Meeting }>(
      `/meetings/${encodeURIComponent(id)}`
    );
    const meeting = payload.meeting;
    const attendance = meeting.attendanceRoster
      ?.map((row) => row.attendance)
      .filter((row): row is NonNullable<typeof row> => Boolean(row)) ?? [];
    return {
      meeting: {
        ...meeting,
        rsvps: meeting.rsvpRoster ?? [],
        attendance
      },
      users: meeting.members ?? [],
      myRsvp:
        typeof meeting.myRsvp === "object"
          ? meeting.myRsvp
          : null,
      myAttendance: meeting.myAttendance ?? null,
      rsvpSummary: meeting.rsvpSummary,
      presentPercent: meeting.attendanceSummary?.presentPercent
    };
  },
  createMeeting: (input: CreateMeetingInput) =>
    request<{ meeting: { id: string } }>("/meetings", { method: "POST", body: input }),
  deleteMeeting: (id: string) =>
    request<void>(`/meetings/${encodeURIComponent(id)}`, { method: "DELETE" }),
  updateRsvp: (id: string, status: RsvpStatus) =>
    request<void>(`/meetings/${encodeURIComponent(id)}/rsvp`, {
      method: "PUT",
      body: { status }
    }),
  updateArrival: (id: string, arrivalStatus: ArrivalStatus) =>
    request<void>(`/meetings/${encodeURIComponent(id)}/arrival`, {
      method: "PUT",
      body: { arrivalStatus }
    }),
  checkIn: (id: string) =>
    request<void>(`/meetings/${encodeURIComponent(id)}/check-in`, { method: "POST" }),
  markAttendance: (id: string, userId: string, status: AttendanceStatus) =>
    request<void>(`/meetings/${encodeURIComponent(id)}/attendance`, {
      method: "PUT",
      body: { userId, status }
    }),
  saveVolunteer: (id: string, input: VolunteerInput) =>
    request<void>(`/meetings/${encodeURIComponent(id)}/volunteers`, {
      method: "PUT",
      body: input
    }),

  announcements: () => request<AnnouncementsPayload>("/announcements"),
  createAnnouncement: (input: {
    title: string;
    body: string;
    priority: "NORMAL" | "IMPORTANT" | "URGENT";
    pinned?: boolean;
  }) => request<void>("/announcements", { method: "POST", body: input }),

  resources: (search = "") =>
    request<ResourcesPayload>(`/resources${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  createResource: (input: {
    title: string;
    description: string;
    type: ResourceType;
    url?: string;
    bibleTopic: string;
    meetingId?: string;
  }) => request<void>("/resources", { method: "POST", body: input }),

  prayer: () => request<PrayerPayload>("/prayer"),
  createPrayer: (input: {
    title: string;
    description: string;
    category: PrayerCategory;
    visibility: PrayerVisibility;
  }) => request<void>("/prayer", { method: "POST", body: input }),
  pray: (id: string) =>
    request<void>(`/prayer/${encodeURIComponent(id)}/pray`, { method: "POST" }),
  updatePrayerStatus: (id: string, status: PrayerStatus) =>
    request<void>(`/prayer/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status }
    }),

  discussions: (channelId = "") =>
    request<DiscussionsPayload>(`/discussions${channelId ? `?channel=${encodeURIComponent(channelId)}` : ""}`),
  discussionChannels: () => request<DiscussionsPayload>("/discussions"),
  discussionMessages: (channelId: string) =>
    request<DiscussionsPayload>(`/discussions?channel=${encodeURIComponent(channelId)}`),
  postMessage: (channelId: string, input: string | { content: string }) =>
    request<void>(`/discussions/${encodeURIComponent(channelId)}/messages`, {
      method: "POST",
      body: typeof input === "string" ? { content: input } : input
    }),
  deleteMessage: (id: string) =>
    request<void>(`/discussions/messages/${encodeURIComponent(id)}`, { method: "DELETE" }),

  reading: () => request<ReadingPayload>("/reading"),
  createReading: (input: { date: string; passage: string; description: string }) =>
    request<void>("/reading", { method: "POST", body: input }),
  completeReading: (id: string) =>
    request<void>(`/reading/${encodeURIComponent(id)}/complete`, { method: "POST" }),

  directory: () => request<DirectoryPayload>("/directory"),
  profile: () => request<{ user: import("../types").User }>("/directory/profile"),
  updateProfile: (input: { name: string; phone?: string; area?: string; phoneVisible: boolean }) =>
    request<{ user: import("../types").User }>("/directory/profile", { method: "PATCH", body: input }),
  reports: () => request<ReportsPayload>("/reports")
};

export { API_ROOT, request };
