import "server-only";
import { API_BASE_URL } from "./api";
import { toKycStatus, type KycStatus } from "./kyc";
import { getToken } from "./session";

/** An error from the Carlust API, carrying the backend's own message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Init = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body, or FormData for uploads. */
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Send without the session token. */
  anonymous?: boolean;
};

/**
 * Calls the Carlust API from the server with the signed-in user's token,
 * like the app's ApiClient (Bearer auth, JSON by default).
 */
export async function api<T = Record<string, unknown>>(path: string, init: Init = {}): Promise<T> {
  const token = init.anonymous ? null : await getToken();
  const qs = init.query
    ? "?" +
      new URLSearchParams(
        Object.entries(init.query)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      )
    : "";

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) {
    body = init.body;
  } else if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${qs}`, {
      method: init.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Unable to connect to the server. Please check your internet connection.", 0);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body; handled below.
  }
  if (!res.ok) {
    const data = json as { message?: unknown; error?: unknown } | null;
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      "Something went wrong. Please try again.";
    throw new ApiError(message, res.status);
  }
  return json as T;
}

export const errorMessage = (e: unknown, fallback = "Something went wrong. Please try again.") =>
  e instanceof ApiError ? e.message : fallback;

/** Signed-in user, as `/api/auth/profile` returns it (AppUser in the app). */
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string;
  image: string | null;
  dateOfBirth: string;
  isHost: boolean;
  isVerified: boolean;
  /** NOT_VERIFIED | VERIFYING | VERIFIED */
  identityVerificationStatus: string | null;
  documentsSubmittedForReview: boolean;
};

const truthy = (v: unknown) => v === true || v === 1 || v === "1";

export function toUser(raw: Record<string, unknown>): User {
  const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const firstName = s(raw.firstName);
  const lastName = s(raw.lastName);
  return {
    id: s(raw.id),
    firstName,
    lastName,
    name: s(raw.name) || `${firstName} ${lastName}`.trim(),
    email: s(raw.email),
    phoneNumber: s(raw.phoneNumber),
    // The API sends the photo as `profilePic`.
    image:
      typeof raw.profilePic === "string" && raw.profilePic
        ? raw.profilePic
        : typeof raw.image === "string" && raw.image
          ? raw.image
          : null,
    dateOfBirth: s(raw.dateOfBirth ?? raw.dob),
    isHost: truthy(raw.isHost),
    isVerified: truthy(raw.isVerified),
    identityVerificationStatus: typeof raw.identityVerificationStatus === "string" ? raw.identityVerificationStatus : null,
    documentsSubmittedForReview: raw.documentsSubmittedForReview === true,
  };
}

/** Verification state for the signed-in user; null if the backend can't be reached. */
export async function getKycStatus(): Promise<KycStatus | null> {
  try {
    const res = await api<{ data?: Record<string, unknown> }>("/api/kyc/status");
    return toKycStatus(res.data ?? {});
  } catch {
    return null;
  }
}

/** The current user, or null when signed out or the token has expired. */
export async function getCurrentUser(): Promise<User | null> {
  if (!(await getToken())) return null;
  try {
    const json = await api<Record<string, unknown>>("/api/auth/profile");
    const raw = (json.user ?? json.data ?? json) as Record<string, unknown>;
    return raw && raw.id ? toUser(raw) : null;
  } catch {
    return null;
  }
}
