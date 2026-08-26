"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const PORTALS = [
  {
    key: "customer",
    emoji: "🍔",
    name: "Customer Food App",
    href: "/customer",
    demoEmail: "customer@quickbite.com",
    color: "#FF6B35",
  },
  {
    key: "restaurant",
    emoji: "🍽️",
    name: "Restaurant Partner",
    href: "/restaurant",
    demoEmail: "owner@quickbite.com",
    color: "#00B894",
  },
  {
    key: "delivery",
    emoji: "🛵",
    name: "Delivery Fleet",
    href: "/delivery",
    demoEmail: "driver@quickbite.com",
    color: "#0984E3",
  },
  {
    key: "admin",
    emoji: "👑",
    name: "Admin Operations",
    href: "/admin",
    demoEmail: "admin@quickbite.com",
    color: "#6C5CE7",
  },
];

export default function HubPage() {
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((r) => setServerUp(r.ok))
      .catch(() => setServerUp(false));
  }, []);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-16"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,107,53,0.15), transparent 40%), radial-gradient(circle at 80% 30%, rgba(9,132,227,0.15), transparent 40%), radial-gradient(circle at 50% 80%, rgba(108,92,231,0.15), transparent 40%), #0b0d14",
        color: "white",
      }}
    >
      <h1 className="text-4xl font-bold mb-2 tracking-tight">QuickBite</h1>
      <p className="text-white/60 mb-2">Multi-portal food delivery platform</p>
      <div className="flex items-center gap-2 text-sm mb-10">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            serverUp ? "bg-green-400" : serverUp === false ? "bg-red-400" : "bg-yellow-400"
          }`}
        />
        <span className="text-white/50">
          API {serverUp ? "online" : serverUp === false ? "offline" : "checking..."} · {API_URL}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {PORTALS.map((p) => (
          <Link
            key={p.key}
            href={`/login?portal=${p.key}&next=${p.href}`}
            className="group rounded-2xl p-6 backdrop-blur-xl border border-white/10 transition-transform hover:-translate-y-1"
            style={{
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-4xl mb-3">{p.emoji}</div>
            <div className="text-lg font-semibold mb-1">{p.name}</div>
            <div className="text-white/50 text-sm mb-4">Demo: {p.demoEmail}</div>
            <div
              className="inline-block px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: p.color }}
            >
              Launch →
            </div>
          </Link>
        ))}
      </div>

      <p className="text-white/30 text-xs mt-10">All demo accounts use password Password@123</p>
    </div>
  );
}
