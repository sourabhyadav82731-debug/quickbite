"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole } from "@quickbite/types";
import { api, clearSession, getAccessToken, getStoredUser, storeSession, storeUser } from "./api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  walletBalance?: number;
  avatarUrl?: string;
}

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    const token = getAccessToken();
    if (token) {
      api.auth
        .me()
        .then((fresh: any) => setUser(fresh))
        .catch(() => {
          clearSession();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res: any = await api.auth.login({ email, password });
    storeSession(res.accessToken, res.refreshToken, res.user);
    setUser(res.user);
    return res.user as AuthUser;
  }

  // No `role` field here by design — public signup only ever creates a CUSTOMER
  // account. The backend independently enforces this too (registerSchema
  // rejects ADMIN outright), but the signup form never even offers the choice.
  async function register(input: RegisterInput) {
    const res: any = await api.auth.register(input as unknown as Record<string, unknown>);
    storeSession(res.accessToken, res.refreshToken, res.user);
    setUser(res.user);
    return res.user as AuthUser;
  }

  // Re-fetches the authenticated user's own record and updates both React
  // state and the cached copy — used after a profile change (e.g. avatar
  // upload) that the rest of the app reads via useAuth().user rather than
  // its own query. Never touches the session tokens.
  async function refreshUser() {
    const fresh: any = await api.auth.me();
    setUser(fresh);
    storeUser(fresh);
  }

  function logout() {
    clearSession();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
