"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@quickbite/types";
import { useAuth } from "@/lib/auth";
import { friendlyErrorMessage } from "@/lib/api";

const ROLE_HOME: Record<string, string> = {
  [UserRole.CUSTOMER]: "/customer",
  [UserRole.RESTAURANT_OWNER]: "/restaurant",
  [UserRole.DELIVERY_PARTNER]: "/delivery",
  [UserRole.ADMIN]: "/admin",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading || success) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const user = await login(trimmedEmail, password);
      setSuccess(true);
      const next = params.get("next") ?? ROLE_HOME[user.role] ?? "/";
      setTimeout(() => router.push(next), 400);
    } catch (err) {
      // The backend already returns "Invalid email or password." for wrong
      // credentials without revealing which one was wrong — this only adds
      // a generic fallback for anything else (network failure, 5xx, etc.).
      setError(friendlyErrorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="qb-auth-shell">
      <div className="qb-auth-card">
        <div className="flex flex-col items-center mb-5">
          <div className="text-3xl mb-2" aria-hidden="true">
            🍔
          </div>
          <h1 className="text-2xl font-heading uppercase tracking-wide">Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--qb-text-secondary)" }}>
            Your next craving is waiting.
          </p>
        </div>

        <form onSubmit={doLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--qb-text-secondary)" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className={`qb-auth-input w-full px-4 ${error ? "qb-auth-input-error" : ""}`}
              style={{ minHeight: 48 }}
              autoComplete="email"
              aria-label="Email address"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--qb-text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={`qb-auth-input w-full pl-4 pr-12 ${error ? "qb-auth-input-error" : ""}`}
                style={{ minHeight: 48 }}
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-0 h-full px-3 text-xs opacity-70 hover:opacity-100"
                style={{ minWidth: 44 }}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => setShowForgotNotice((v) => !v)}
              className="text-xs"
              style={{ color: "var(--qb-glow)", minHeight: 44 }}
            >
              Forgot Password?
            </button>
          </div>

          {showForgotNotice && (
            <p className="text-xs -mt-2" style={{ color: "var(--qb-text-muted)" }} role="status">
              Forgot password is not configured yet — please contact support to regain access to
              your account.
            </p>
          )}

          {error && (
            <p className="text-sm qb-auth-status-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm qb-auth-status-success" role="status">
              ✓ Signed in — redirecting...
            </p>
          )}

          <button type="submit" disabled={loading || success} className="qb-auth-btn-primary">
            {loading ? "Signing in..." : success ? "Signed in ✓" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--qb-text-secondary)" }}>
          New to Quickbits?{" "}
          <Link href="/signup" className="font-medium" style={{ color: "var(--qb-glow)" }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
