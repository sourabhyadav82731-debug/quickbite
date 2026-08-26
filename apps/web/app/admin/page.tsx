"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.admin.dashboard(),
    refetchInterval: 10000,
  });
  const d = data as any;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Executive Command Center</h1>
      {d && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi label="GMV" value={`₹${d.gmv.toFixed(0)}`} />
          <Kpi label="Total Orders" value={d.totalOrders} />
          <Kpi label="Active Orders" value={d.activeOrders} />
          <Kpi label="Net Revenue" value={`₹${d.netRevenue.toFixed(0)}`} />
          <Kpi label="Active Fleet" value={d.activeFleetCount} />
          <Kpi label="Avg Delivery" value={`${d.avgDeliveryTimeMinutes}m`} />
        </div>
      )}
      <p className="text-sm opacity-60">
        Revenue trend charts and zone-level breakdowns are planned for a future pass — this reads
        live from the orders ledger.
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
