"use client";

import { useState } from "react";

const ROLES = ["Manager", "Chef", "Cashier", "Kitchen Hand"];
const PERMISSIONS = ["Menu Edit", "Refund Approval", "Financial Access"];

export default function StaffPage() {
  const [staff, setStaff] = useState([
    { name: "Deepak Rao", role: "Manager", perms: ["Menu Edit", "Refund Approval"] },
    { name: "Meena Iyer", role: "Chef", perms: ["Menu Edit"] },
  ]);

  function togglePerm(idx: number, perm: string) {
    setStaff((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, perms: s.perms.includes(perm) ? s.perms.filter((p) => p !== perm) : [...s.perms, perm] }
          : s,
      ),
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Staff & Permissions</h1>
      <p className="text-xs opacity-60">
        Directory is local-only in this build — a real staff/auth model is planned for a future
        pass.
      </p>

      <div className="glass-card divide-y" style={{ borderColor: "var(--portal-border)" }}>
        {staff.map((s, i) => (
          <div key={s.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{s.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full glass-card">{s.role}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {PERMISSIONS.map((perm) => (
                <button
                  key={perm}
                  onClick={() => togglePerm(i, perm)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: s.perms.includes(perm) ? "var(--portal-primary)" : "var(--portal-border)",
                    color: s.perms.includes(perm) ? "white" : "var(--portal-fg)",
                  }}
                >
                  {perm}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
