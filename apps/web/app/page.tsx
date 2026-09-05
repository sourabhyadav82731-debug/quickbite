"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const PORTALS = [
  { key: "customer", emoji: "🍔", name: "Customer Food App", href: "/customer" },
  { key: "restaurant", emoji: "🍽️", name: "Restaurant Partner", href: "/restaurant" },
  { key: "delivery", emoji: "🛵", name: "Delivery Fleet", href: "/delivery" },
  { key: "admin", emoji: "👑", name: "Admin Operations", href: "/admin" },
];

export default function HubPage() {
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((r) => setServerUp(r.ok))
      .catch(() => setServerUp(false));
  }, []);

  return (
    <div className="qb-auth-shell flex-col">
      <h1 className="font-heading text-4xl uppercase tracking-wide mb-2" style={{ color: "var(--qb-text)" }}>
        Quickbits
      </h1>
      <p className="mb-2" style={{ color: "var(--qb-text-secondary)" }}>
        Bites that reach you quick!
      </p>
      <div className="flex items-center gap-2 text-sm mb-10">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: serverUp ? "var(--qb-success)" : serverUp === false ? "var(--qb-error)" : "var(--qb-warning)",
          }}
        />
        <span style={{ color: "var(--qb-text-muted)" }}>
          API {serverUp ? "online" : serverUp === false ? "offline" : "checking..."} · {API_URL}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {PORTALS.map((p) => (
          <Link
            key={p.key}
            href={`/login?portal=${p.key}&next=${p.href}`}
            className="group rounded-2xl p-6 backdrop-blur-xl border transition-transform hover:-translate-y-1"
            style={{ background: "var(--qb-card)", borderColor: "var(--qb-border)", color: "var(--qb-text)" }}
          >
            <div className="text-4xl mb-3">{p.emoji}</div>
            <div className="text-lg font-semibold mb-4">{p.name}</div>
            <div className="qb-btn-cta inline-block px-4 py-2 text-sm">Launch →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
