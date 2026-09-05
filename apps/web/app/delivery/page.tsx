"use client";

import { useQuery } from "@tanstack/react-query";
import { api, apiClient } from "@/lib/api";

export default function DeliveryDashboard() {
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const { data: earnings } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });
  const { data: active } = useQuery({ queryKey: ["driver-active"], queryFn: () => apiClient.get<any[]>("/deliveries/active") });

  const p = profile as any;
  const e = earnings as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partner Dashboard</h1>
        <p className="text-sm opacity-60">Live totals from your completed trips.</p>
      </div>

      <div className="d3-hero p-6">
        <div className="text-xs opacity-80 mb-1">Total Earnings</div>
        <div className="text-4xl font-bold mb-1">₹{e?.total?.toFixed(0) ?? "0"}</div>
        <div className="text-xs opacity-80">{e?.tripsCompleted ?? 0} completed trips all-time</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon="📦" label="Total Trips" value={e?.tripsCompleted ?? 0} />
        <StatCard icon="🗓️" label="Today's Trips" value={e?.todayTrips ?? 0} />
        <StatCard icon="📅" label="This Week's Trips" value={e?.weekTrips ?? 0} />
        <StatCard icon="💰" label="Today's Earnings" value={`₹${e?.todayEarnings?.toFixed(0) ?? "0"}`} accent />
        <StatCard icon="💵" label="This Week's Earnings" value={`₹${e?.weekEarnings?.toFixed(0) ?? "0"}`} accent />
        <StatCard icon="⭐" label="Rating" value={p?.rating != null ? `★ ${p.rating.toFixed(1)}` : "-"} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon="✅" label="Acceptance Rate" value={p?.acceptanceRate != null ? `${p.acceptanceRate}%` : "-"} />
        <StatCard icon="⏱️" label="On-Time Rate" value={p?.onTimeRate != null ? `${p.onTimeRate}%` : "-"} />
      </div>

      {((active as any[]) ?? []).length > 0 && (
        <div className="d3-card d3-card-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">🚚 Active delivery in progress</p>
            <p className="text-xs opacity-60">Continue where you left off.</p>
          </div>
          <a href="/delivery/active" className="d3-btn portal-btn-primary px-4 py-2 text-sm rounded-xl">
            View
          </a>
        </div>
      )}

      <p className="text-sm opacity-60">
        Go ON DUTY from the ⋮ menu to start receiving delivery requests.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="d3-card d3-card-hover p-4">
      <div className="d3-icon-badge mb-2">{icon}</div>
      <div className="text-xs opacity-60 mb-0.5">{label}</div>
      <div
        className="text-xl font-bold"
        style={accent ? { color: "var(--portal-primary)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
