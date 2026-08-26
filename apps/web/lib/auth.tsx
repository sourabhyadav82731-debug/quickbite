"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole } from "@quickbite/types";
import { api, clearSession, getAccessToken, getStoredUser, storeSession } from "./api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletBalance?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
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

  function logout() {
    clearSession();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
