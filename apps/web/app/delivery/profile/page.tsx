"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient, api, uploadImage, friendlyErrorMessage, API_URL } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

// No document schema/API exists anywhere in this backend (DriverProfileEntity
// has no license/registration/insurance/identity fields, and there's no
// uploads endpoint for them) — these are the documents a real system would
// track, shown as an honest "not yet available" state rather than fake
// "Verified" badges.
const PLANNED_DOCUMENTS = ["Driving License", "Vehicle Registration (RC)", "Insurance", "Identity Document"];

export default function DeliveryProfilePage() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const p = profile as any;

  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadImage("/users/me/avatar", file);
      await refreshUser();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to upload photo"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setRemoving(true);
    setError(null);
    try {
      await api.uploads.removeUserAvatar();
      await refreshUser();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to remove photo"));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Profile &amp; Documents</h1>
        <p className="text-sm opacity-60">Your account details, as they exist on Quickbits's servers.</p>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={resolveUrl(user.avatarUrl) ?? ""}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: "2px solid var(--qb-primary)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ border: "2px solid var(--qb-primary)", background: "var(--qb-elevated)", color: "var(--qb-primary)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "D"}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label
              className="qb-btn-secondary text-xs px-3 py-1.5 rounded-lg cursor-pointer text-center"
              style={{ minHeight: 36 }}
            >
              {uploading ? "Uploading…" : user?.avatarUrl ? "Change Photo" : "Update Profile Photo"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onPhotoSelected(e.target.files?.[0])}
              />
            </label>
            {user?.avatarUrl && (
              <button
                onClick={removePhoto}
                disabled={removing}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                style={{ color: "var(--qb-error)", minHeight: 36 }}
              >
                {removing ? "Removing…" : "Remove Photo"}
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="space-y-2 text-sm pt-2 border-t" style={{ borderColor: "var(--portal-border)" }}>
          <Row label="Full Name" value={user?.name ?? "—"} />
          <Row label="Phone" value={user?.phone ?? "Not set"} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Driver ID" value={p?.id ? p.id.slice(0, 8).toUpperCase() : "—"} />
          <Row
            label="Vehicle"
            value={p ? `${p.vehicleType} · ${p.vehicleNumber}` : "—"}
          />
        </div>
      </div>

      <div className="glass-card p-5 space-y-2 text-sm">
        <h2 className="font-semibold mb-1">Documents</h2>
        <p className="text-xs opacity-50 mb-2">
          Document upload and verification isn't connected to a live backend yet — this is a
          placeholder for where it will appear once that capability exists.
        </p>
        {PLANNED_DOCUMENTS.map((doc) => (
          <div key={doc} className="flex items-center justify-between">
            <span className="opacity-80">{doc}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "var(--qb-elevated)", color: "var(--qb-text-muted)" }}
            >
              Not available yet
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-60 text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
