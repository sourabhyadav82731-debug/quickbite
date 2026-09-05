"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveProfile() {
    await api.users.updateProfile({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function changePassword() {
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.users.changePassword(currentPassword, newPassword);
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: any) {
      setPwError(err?.message ?? "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Admin Profile &amp; Security</h1>

      <div className="qb-admin-kpi-card space-y-3">
        <h2 className="font-semibold text-sm">Profile</h2>
        <div>
          <label className="text-xs opacity-60">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">Email</label>
          <div className="text-sm mt-1 opacity-80">{user?.email}</div>
        </div>
        <button onClick={saveProfile} className="portal-btn-primary px-4 py-2 text-sm">
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="qb-admin-kpi-card space-y-3">
        <h2 className="font-semibold text-sm">Security &mdash; Change Password</h2>
        <div>
          <label className="text-xs opacity-60">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs opacity-60">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm mt-1"
          />
        </div>
        {pwError && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{pwError}</p>}
        <button
          onClick={changePassword}
          disabled={pwBusy || !currentPassword || !newPassword}
          className="portal-btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {pwBusy ? "Updating..." : pwSaved ? "Password Updated!" : "Update Password"}
        </button>
      </div>

      <div className="qb-admin-kpi-card text-sm space-y-2">
        <h2 className="font-semibold mb-1">Session</h2>
        <div className="flex justify-between"><span className="opacity-60">Role</span><span>Administrator</span></div>
        <div className="flex justify-between"><span className="opacity-60">Realtime Gateways</span><span className="opacity-70">/ws/orders, /ws/delivery</span></div>
      </div>
    </div>
  );
}
