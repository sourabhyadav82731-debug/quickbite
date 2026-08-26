"use client";

import { ApiClient, createDomainApis } from "@quickbite/api-client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";
// Publishable key only — safe for the browser. The secret never leaves the server.
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

const ACCESS_KEY = "qb_access";
const REFRESH_KEY = "qb_refresh";
const USER_KEY = "qb_user";
const ROLE_COOKIE = "qb_role";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeSession(accessToken: string, refreshToken: string, user?: any) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.cookie = `${ROLE_COOKIE}=${user.role}; path=/; max-age=604800`;
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
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
