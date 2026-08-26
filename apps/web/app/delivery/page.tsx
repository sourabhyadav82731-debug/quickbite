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
      <h1 className="text-xl font-bold">Partner Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Kpi label="Today's Earnings" value={`₹${e?.total?.toFixed(0) ?? 0}`} />
        <Kpi label="Completed Trips" value={e?.tripsCompleted ?? 0} />
        <Kpi label="Acceptance Rate" value={`${p?.acceptanceRate ?? "-"}%`} />
        <Kpi label="On-Time Rate" value={`${p?.onTimeRate ?? "-"}%`} />
        <Kpi label="Rating" value={`★ ${p?.rating?.toFixed(1) ?? "-"}`} />
      </div>

      {((active as any[]) ?? []).length > 0 && (
        <div className="glass-card p-4">
          <p className="text-sm font-medium">You have an active delivery in progress.</p>
          <a href="/delivery/active" className="portal-btn-primary inline-block px-4 py-2 text-sm mt-2">
            Go to Active Delivery
          </a>
        </div>
      )}

      <p className="text-sm opacity-60">
        Go online using the toggle in the header to start receiving delivery requests.
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4">
      <div className="text-xs opacity-60 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
