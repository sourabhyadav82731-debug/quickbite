"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminFinancePage() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api.admin.dashboard() });
  const d = data as any;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Financial Settlements & Tax Engine</h1>
      {d && (
        <div className="glass-card p-5 space-y-2 text-sm">
          <div className="flex justify-between"><span>Gross Merchandise Value</span><span>₹{d.gmv.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Platform Net Revenue</span><span>₹{d.netRevenue.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivered Orders</span><span>{d.deliveredOrders}</span></div>
        </div>
      )}
      <p className="text-xs opacity-60">
        Automated weekly batch payouts and downloadable GST reports are planned for a future
        pass — restaurant-level commission math is live under each restaurant's Finance page.
      </p>
    </div>
  );
}
