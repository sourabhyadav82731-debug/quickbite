"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CouponType } from "@quickbite/types";
import { api } from "@/lib/api";

export default function AdminOffersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: () => api.admin.coupons("platform"),
  });
  const offers = (data as any[]) ?? [];
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>(CouponType.PERCENTAGE);
  const [value, setValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!code.trim()) return;
    try {
      // No restaurantId -> platform-wide, which the backend already only lets
      // an admin create (CouponsService.create rejects it for anyone else).
      await api.coupons.create({
        code,
        type,
        value: Number(value) || 0,
        minOrderValue: 0,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      setCode("");
      setValue("");
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    } catch (err: any) {
      setError(err?.message ?? "Could not create offer.");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await api.coupons.update(id, { isActive: !isActive });
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Platform Offers</h1>
      <p className="text-xs opacity-60">
        Platform-wide offers run on the same coupon engine as restaurant coupons — filtered here to
        offers with no restaurant attached, so they can never drift out of sync with the rest of the
        coupon system.
      </p>

      <div className="qb-admin-kpi-card space-y-2">
        <h2 className="font-semibold text-sm mb-1">Create Platform Offer</h2>
        <input
          placeholder="Offer code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full glass-card px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className="flex-1 glass-card px-2 py-2 text-sm">
            <option value={CouponType.PERCENTAGE}>% OFF</option>
            <option value={CouponType.FLAT}>Flat ₹ OFF</option>
            <option value={CouponType.FREE_DELIVERY}>Free Delivery</option>
          </select>
          <input placeholder="Value" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-24 glass-card px-2 py-2 text-sm" />
        </div>
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full glass-card px-3 py-2 text-sm" />
        {error && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{error}</p>}
        <button onClick={create} className="portal-btn-primary px-4 py-2 text-sm">Create Offer</button>
      </div>

      <div className="space-y-2">
        {offers.map((c: any) => (
          <div key={c.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-bold">{c.code}</span>
              <div className="opacity-60 text-xs">{c.type} · Used {c.timesUsed} · Expires {new Date(c.expiresAt).toLocaleDateString()}</div>
            </div>
            <button onClick={() => toggleActive(c.id, c.isActive)} className={`qb-admin-badge ${c.isActive ? "qb-admin-badge-success" : "qb-admin-badge-error"}`}>
              {c.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
        {!isLoading && offers.length === 0 && <p className="opacity-60 text-sm">No platform offers yet.</p>}
      </div>
    </div>
  );
}
