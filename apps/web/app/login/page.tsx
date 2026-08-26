"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@quickbite/types";
import { useAuth } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  [UserRole.CUSTOMER]: "/customer",
  [UserRole.RESTAURANT_OWNER]: "/restaurant",
  [UserRole.DELIVERY_PARTNER]: "/delivery",
  [UserRole.ADMIN]: "/admin",
};

const DEMO_ACCOUNTS = [
  { email: "customer@quickbite.com", label: "🍔 Customer" },
  { email: "owner@quickbite.com", label: "🍽️ Restaurant Owner" },
  { email: "driver@quickbite.com", label: "🛵 Delivery Partner" },
  { email: "admin@quickbite.com", label: "👑 Admin" },
];

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doLogin(e?: string, p?: string) {
    setError(null);
    setLoading(true);
    try {
      const user = await login(e ?? email, p ?? password);
      const next = params.get("next") ?? ROLE_HOME[user.role] ?? "/";
      router.push(next);
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">Sign in to QuickBite</h1>
        <p className="text-zinc-400 text-sm mb-6">
          One login, routed to the portal for your role.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            doLogin();
          }}
          className="space-y-3 mb-6"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-white text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-white text-sm"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black font-semibold py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-zinc-500 text-xs mb-2">Quick demo login</div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => doLogin(acc.email, "Password@123")}
              className="rounded-lg border border-zinc-800 text-zinc-200 text-xs py-2 hover:bg-zinc-900"
            >
              {acc.label}
            </button>
          ))}
        </div>
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
