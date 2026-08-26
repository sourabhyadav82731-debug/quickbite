"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function DeliveryHistoryPage() {
  const { data } = useQuery({
    queryKey: ["driver-history"],
    queryFn: () => apiClient.get<any[]>("/deliveries/history"),
  });

  return (
    <div className="max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-2">Trip History</h1>
      {((data as any[]) ?? []).map((d) => (
        <div key={d.id} className="glass-card p-4 flex items-center justify-between text-sm">
          <div>
            <div className="font-semibold">Order #{d.orderId.slice(0, 8)}</div>
            <div className="opacity-60 text-xs">{d.distanceKm} km · {new Date(d.updatedAt).toLocaleString()}</div>
          </div>
          <div className="font-bold">₹{(d.basePay + d.distancePay + d.surgeBonus + d.tip).toFixed(0)}</div>
        </div>
      ))}
      {((data as any[]) ?? []).length === 0 && <p className="opacity-60 text-sm">No completed trips yet.</p>}
    </div>
  );
}
