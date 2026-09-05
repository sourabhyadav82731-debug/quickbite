"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CouponType } from "@quickbite/types";
import { api } from "@/lib/api";

const emptyForm = {
  code: "",
  type: CouponType.PERCENTAGE,
  value: "",
  minOrderValue: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => api.admin.coupons() });
  const coupons = (data as any[]) ?? [];
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!form.code.trim()) return;
    try {
      await api.coupons.create({
        code: form.code,
        type: form.type,
        value: Number(form.value) || 0,
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (err: any) {
      setError(err?.message ?? "Could not create coupon.");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await api.coupons.update(id, { isActive: !isActive });
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Coupon Management</h1>

      <div className="qb-admin-kpi-card space-y-2">
        <h2 className="font-semibold text-sm mb-1">Create Coupon</h2>
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
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Min order value"
            type="number"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            className="glass-card px-3 py-2 text-sm"
          />
          <input
            placeholder="Max discount (optional)"
            type="number"
            value={form.maxDiscount}
            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
            className="glass-card px-3 py-2 text-sm"
          />
          <input
            placeholder="Total usage limit (optional)"
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            className="glass-card px-3 py-2 text-sm"
          />
          <input
            placeholder="Per-user limit (optional)"
            type="number"
            value={form.perUserLimit}
            onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
            className="glass-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">Expires At</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        {error && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{error}</p>}
        <button onClick={create} className="portal-btn-primary px-4 py-2 text-sm">
          Create Coupon
        </button>
      </div>

      <div className="space-y-2">
        {coupons.map((c: any) => (
          <div key={c.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-bold">{c.code}</span>
              <div className="opacity-60 text-xs">
                {c.restaurantId ? "Restaurant-scoped" : "Platform-wide"} · {c.type} · Used {c.timesUsed}
                {c.usageLimit ? `/${c.usageLimit}` : ""}
                {c.perUserLimit ? ` · ${c.perUserLimit}/user` : ""}
              </div>
            </div>
            <button
              onClick={() => toggleActive(c.id, c.isActive)}
              className={`qb-admin-badge ${c.isActive ? "qb-admin-badge-success" : "qb-admin-badge-error"}`}
            >
              {c.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
        {!isLoading && coupons.length === 0 && <p className="opacity-60 text-sm">No coupons yet.</p>}
      </div>
    </div>
  );
}
