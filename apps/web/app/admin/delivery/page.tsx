"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function AdminFleetPage() {
  const { data } = useQuery({ queryKey: ["admin-drivers"], queryFn: () => apiClient.get<any[]>("/admin/drivers") });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Fleet Management</h1>
      <div className="space-y-2">
        {((data as any[]) ?? []).map((d) => (
          <div key={d.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{d.vehicleType} · {d.vehicleNumber}</div>
              <div className="opacity-60 text-xs">
                ★ {d.rating.toFixed(1)} · Acceptance {d.acceptanceRate}% · On-time {d.onTimeRate}%
              </div>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: d.isOnline ? "#00B89422" : "#95a5a622", color: d.isOnline ? "#00B894" : "#95a5a6" }}
            >
              {d.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        ))}
        {((data as any[]) ?? []).length === 0 && <p className="opacity-60 text-sm">No drivers yet.</p>}
      </div>
    </div>
  );
}
