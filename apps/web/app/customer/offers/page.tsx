"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function OffersPage() {
  const { data: coupons } = useQuery({ queryKey: ["coupons"], queryFn: () => api.coupons.list() });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Offers & Coupons</h1>
      <div className="space-y-3">
        {((coupons as any[]) ?? []).map((c) => (
          <div key={c.id} className="glass-card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--qb-glow)", color: "#171313" }}
                >
                  {c.type === "PERCENTAGE" && `${c.value}% OFF`}
                  {c.type === "FLAT" && `₹${c.value} OFF`}
                  {c.type === "FREE_DELIVERY" && "FREE DELIVERY"}
                </span>
                <span className="font-bold" style={{ color: "var(--portal-primary)" }}>
                  {c.code}
                </span>
              </div>
              {c.minOrderValue > 0 && (
                <div className="text-xs opacity-70">Min order ₹{c.minOrderValue}</div>
              )}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(c.code)}
              className="portal-btn-primary px-3 py-1.5 text-xs shrink-0"
            >
              Copy
            </button>
          </div>
        ))}
        {((coupons as any[]) ?? []).length === 0 && (
          <p className="opacity-60 text-sm">No active offers right now.</p>
        )}
      </div>
    </div>
  );
}
