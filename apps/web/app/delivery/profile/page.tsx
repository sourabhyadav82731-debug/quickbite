"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";

export default function DeliveryProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const p = profile as any;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Partner Profile</h1>

      <div className="glass-card p-5 space-y-1 text-sm">
        <div><b>{user?.name}</b></div>
        <div className="opacity-70">{user?.email}</div>
        {p && (
          <div className="opacity-70">
            {p.vehicleType} · {p.vehicleNumber} · ★ {p.rating?.toFixed(1)} ({p.ratingCount})
          </div>
        )}
      </div>

      <div className="glass-card p-5 space-y-2 text-sm">
        <h2 className="font-semibold mb-1">Compliance Vault</h2>
        {["Driving License", "Vehicle RC", "PAN Card", "Insurance"].map((doc) => (
          <div key={doc} className="flex items-center justify-between">
            <span>{doc}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#00B89422", color: "#00B894" }}>
              Verified
            </span>
          </div>
        ))}
        <p className="text-xs opacity-50 mt-2">
          Document upload and expiry alerts are UI-only placeholders in this build.
        </p>
      </div>

      <div className="glass-card p-5 space-y-1 text-sm">
        <h2 className="font-semibold mb-1">Emergency Contact</h2>
        <p className="opacity-70">Not set — add one from the Safety Center.</p>
      </div>
    </div>
  );
}
