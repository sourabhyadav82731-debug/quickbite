"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CouponType } from "@quickbite/types";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

type CouponStatus = "Active" | "Scheduled" | "Expired" | "Paused";

function statusOf(c: any): CouponStatus {
  if (!c.isActive) return "Paused";
  const now = new Date();
  if (new Date(c.expiresAt) <= now) return "Expired";
  if (c.startsAt && new Date(c.startsAt) > now) return "Scheduled";
  return "Active";
}

const STATUS_COLOR: Record<CouponStatus, string> = {
  Active: "var(--qb-success)",
  Scheduled: "var(--qb-primary)",
  Expired: "var(--qb-text-muted)",
  Paused: "var(--qb-warning)",
};

export default function RestaurantOffersPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: coupons } = useQuery({
    queryKey: ["restaurant-coupons", active?.id],
    queryFn: () => api.coupons.listMine(active.id),
    enabled: !!active,
  });
  const [form, setForm] = useState({
    code: "",
    type: CouponType.PERCENTAGE,
    value: "",
    minOrderValue: "",
    startsAt: "",
    expiresAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["restaurant-coupons", active.id] });
  }

  async function create() {
    if (!active || !form.code.trim() || !form.value) {
      setError("Code and value are required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.coupons.create({
        code: form.code,
        restaurantId: active.id,
        type: form.type,
        value: Number(form.value) || 0,
        minOrderValue: Number(form.minOrderValue) || 0,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      setForm({ code: "", type: CouponType.PERCENTAGE, value: "", minOrderValue: "", startsAt: "", expiresAt: "" });
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not create coupon"));
    } finally {
      setCreating(false);
    }
  }

  async function togglePause(c: any) {
    setBusyId(c.id);
    setError(null);
    try {
      await api.coupons.update(c.id, { isActive: !c.isActive });
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not update coupon"));
    } finally {
      setBusyId(null);
    }
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const mine = ((coupons as any[]) ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold">Offers & Coupons</h1>
        <p className="text-sm opacity-60">Discount campaigns scoped to {active.name}.</p>
      </div>

      <div className="glass-card p-4 space-y-2">
        <input
          placeholder="Coupon code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="w-full glass-card px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
            className="flex-1 glass-card px-2 py-2 text-sm"
          >
            <option value={CouponType.PERCENTAGE}>% OFF</option>
            <option value={CouponType.FLAT}>Flat ₹ OFF</option>
            <option value={CouponType.FREE_DELIVERY}>Free Delivery</option>
          </select>
          <input
            placeholder="Value"
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="w-24 glass-card px-2 py-2 text-sm"
          />
        </div>
        <input
          placeholder="Minimum order value"
          type="number"
          value={form.minOrderValue}
          onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
          className="w-full glass-card px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] opacity-60">Starts (optional)</label>
            <input
              type="date"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full glass-card px-2 py-1.5 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] opacity-60">Expires</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full glass-card px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={create}
          disabled={creating}
          className="portal-btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          {creating ? "Creating…" : "Create Coupon"}
        </button>
      </div>

      <div className="space-y-2">
        {mine.map((c) => {
          const status = statusOf(c);
          return (
            <div key={c.id} className="glass-card p-4 text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold">{c.code}</span>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}
                >
                  {status}
                </span>
              </div>
              <div className="text-xs opacity-70">
                {c.type === "PERCENTAGE" ? `${c.value}% off` : c.type === "FLAT" ? `₹${c.value} off` : "Free delivery"}
                {c.minOrderValue > 0 && ` · Min ₹${c.minOrderValue}`}
                {c.usageLimit && ` · Limit ${c.usageLimit}`}
              </div>
              <div className="text-[10px] opacity-50">
                Used {c.timesUsed} times · Expires {new Date(c.expiresAt).toLocaleDateString("en-IN")}
              </div>
              <button
                onClick={() => togglePause(c)}
                disabled={busyId === c.id || status === "Expired"}
                className="text-xs px-3 py-1.5 rounded-lg glass-card disabled:opacity-40"
                style={{ minHeight: 32 }}
              >
                {c.isActive ? "Pause" : "Resume"}
              </button>
            </div>
          );
        })}
        {mine.length === 0 && <p className="opacity-60 text-sm">No campaigns yet.</p>}
      </div>
    </div>
  );
}
