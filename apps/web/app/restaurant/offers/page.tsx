"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CouponType } from "@quickbite/types";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function RestaurantOffersPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: coupons } = useQuery({ queryKey: ["coupons"], queryFn: () => api.coupons.list() });
  const [form, setForm] = useState({
    code: "",
    type: CouponType.PERCENTAGE,
    value: "",
    minOrderValue: "",
    expiresAt: "",
  });

  async function create() {
    if (!active) return;
    await api.coupons.create({
      code: form.code,
      restaurantId: active.id,
      type: form.type,
      value: Number(form.value) || 0,
      minOrderValue: Number(form.minOrderValue) || 0,
      expiresAt: form.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    setForm({ code: "", type: CouponType.PERCENTAGE, value: "", minOrderValue: "", expiresAt: "" });
    qc.invalidateQueries({ queryKey: ["coupons"] });
  }

  const mine = ((coupons as any[]) ?? []).filter((c) => c.restaurantId === active?.id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">Marketing & Discount Campaigns</h1>

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
        <button onClick={create} className="portal-btn-primary px-4 py-2 text-sm">
          Create Coupon
        </button>
      </div>

      <div className="space-y-2">
        {mine.map((c) => (
          <div key={c.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <span className="font-bold">{c.code}</span>
            <span className="opacity-60 text-xs">Used {c.timesUsed} times</span>
          </div>
        ))}
        {mine.length === 0 && <p className="opacity-60 text-sm">No campaigns yet.</p>}
      </div>
    </div>
  );
}
