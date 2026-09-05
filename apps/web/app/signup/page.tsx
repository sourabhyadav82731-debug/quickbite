"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { friendlyErrorMessage } from "@/lib/api";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // No role is ever sent — public signup always creates a CUSTOMER account.
      await register({ name, email, phone: phone || undefined, password });
      router.push("/customer");
    } catch (err: any) {
      setError(friendlyErrorMessage(err, "Could not create account"));
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
          <h1 className="text-2xl font-heading uppercase tracking-wide">Create Your Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--qb-text-secondary)" }}>
            Sign up to start ordering on Quickbits.
          </p>
        </div>

        <form onSubmit={doSignup} className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="qb-auth-input w-full px-4 py-3"
            style={{ minHeight: 48 }}
            required
            minLength={2}
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="qb-auth-input w-full px-4 py-3"
            style={{ minHeight: 48 }}
            required
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="qb-auth-input w-full px-4 py-3"
            style={{ minHeight: 48 }}
            autoComplete="tel"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="qb-auth-input w-full px-4 py-3"
            style={{ minHeight: 48 }}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="qb-auth-input w-full px-4 py-3"
            style={{ minHeight: 48 }}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && (
            <p className="text-sm qb-auth-status-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="qb-auth-btn-primary">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--qb-text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--qb-glow)" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
