"use client";

import { ApiClient, ApiError, createDomainApis, uploadFile } from "@quickbite/api-client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";
// Publishable key only — safe for the browser. The secret never leaves the server.
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

// sessionStorage (not localStorage) is deliberate: it's isolated per browser
// tab, so logging into a different role in another tab of the same browser
// can't overwrite this tab's session. Route protection accordingly moved from
// a shared qb_role cookie + middleware (cookies can't be tab-scoped) to a
// per-tab client-side check in PortalChrome — see that file for why.
const ACCESS_KEY = "qb_access";
const REFRESH_KEY = "qb_refresh";
const USER_KEY = "qb_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeSession(accessToken: string, refreshToken: string, user?: any) {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// Updates only the cached user record (e.g. after a profile-photo change) —
// never touches the tokens, unlike storeSession above.
export function storeUser(user: any) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export const apiClient = new ApiClient({
  baseUrl: API_URL,
  getAccessToken,
  getRefreshToken,
  onTokensRefreshed: (accessToken, refreshToken) => {
    storeSession(accessToken, refreshToken);
  },
  onAuthFailure: () => {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
  },
});

export const api = createDomainApis(apiClient);

// Multipart image uploads (restaurant cover/gallery photos, dish photos) go
// through here rather than `api.*` — see uploadFile's own comment for why the
// shared JSON-only ApiClient can't carry these.
export function uploadImage(path: string, file: File) {
  return uploadFile(path, file, { baseUrl: API_URL, getAccessToken });
}

// The backend's ZodValidationPipe returns {message: "Validation failed", issues: [...]}
// for 400s — surfacing the generic top-level message alone ("Validation failed")
// tells the user nothing actionable. This pulls the first real issue out when present.
export function friendlyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const issues = (err.body as any)?.issues;
    if (Array.isArray(issues) && issues.length > 0) {
      const first = issues[0];
      const field = Array.isArray(first.path) && first.path.length ? `${first.path.join(".")}: ` : "";
      return `${field}${first.message}`;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
