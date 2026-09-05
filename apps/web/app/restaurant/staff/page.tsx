"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StaffRole } from "@quickbite/types";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

const ROLES = [StaffRole.MANAGER, StaffRole.KITCHEN, StaffRole.STAFF];

export default function StaffPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: staff } = useQuery({
    queryKey: ["restaurant-staff", active?.id],
    queryFn: () => api.staff.list(active.id),
    enabled: !!active,
  });
  const [form, setForm] = useState({ name: "", email: "", role: StaffRole.STAFF });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["restaurant-staff", active.id] });
  }

  async function invite() {
    if (!active || !form.name.trim()) {
      setError("Name is required");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      await api.staff.invite({
        restaurantId: active.id,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
      });
      setForm({ name: "", email: "", role: StaffRole.STAFF });
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not add staff member"));
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(id: string, role: StaffRole) {
    setBusyId(id);
    try {
      await api.staff.update(id, { role });
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not update role"));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setBusyId(id);
    try {
      await api.staff.update(id, { isActive: !isActive });
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not update status"));
    } finally {
      setBusyId(null);
    }
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const list = (staff as any[]) ?? [];

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Staff</h1>
        <p className="text-xs opacity-60">
          A roster for your own reference — staff listed here have no separate login and can never
          act on your restaurant's data themselves; only you (the owner) can, using this dashboard.
        </p>
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex gap-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 glass-card px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
            className="glass-card px-2 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <input
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full glass-card px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={invite}
          disabled={inviting}
          className="portal-btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          {inviting ? "Adding…" : "Invite Staff"}
        </button>
      </div>

      <div className="glass-card divide-y" style={{ borderColor: "var(--portal-border)" }}>
        {list.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-semibold" style={{ opacity: s.isActive ? 1 : 0.5 }}>
                {s.name}
              </div>
              <div className="text-xs opacity-60">{s.email ?? "No email on file"}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={s.role}
                onChange={(e) => changeRole(s.id, e.target.value as StaffRole)}
                disabled={busyId === s.id}
                className="text-xs px-2 py-1.5 rounded-lg glass-card disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleActive(s.id, s.isActive)}
                disabled={busyId === s.id}
                className="text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                style={{
                  background: s.isActive ? "#e7404022" : "#00B89422",
                  color: s.isActive ? "#e74040" : "#00B894",
                  minHeight: 32,
                }}
              >
                {s.isActive ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="p-6 text-center text-sm opacity-60">No staff added yet.</p>}
      </div>
    </div>
  );
}
