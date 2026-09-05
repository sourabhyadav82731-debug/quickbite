"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await apiClient.patch("/users/me", { name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold">Profile</h1>

      <div className="glass-card p-5 space-y-3">
        <div>
          <label className="text-xs opacity-60">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">Email</label>
          <div className="text-sm mt-1 opacity-80">{user?.email}</div>
        </div>
        <button onClick={save} className="portal-btn-primary px-4 py-2 text-sm">
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="glass-card p-5 flex items-center justify-between">
        <span className="font-semibold">Quickbits Wallet</span>
        <span className="text-lg font-bold" style={{ color: "var(--portal-primary)" }}>
          ₹{user?.walletBalance ?? 0}
        </span>
      </div>

      <div className="glass-card p-5 space-y-2 text-sm">
        <h2 className="font-semibold mb-1">Notification Preferences</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> Order updates
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> Promotions & offers
        </label>
      </div>
    </div>
  );
}
