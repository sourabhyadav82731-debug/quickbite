"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function DeliveryHistoryPage() {
  // listHistoryForDriver already filters to DELIVERED only and sorts newest
  // first server-side — matches the completion condition exactly.
  const { data, isLoading } = useQuery({
    queryKey: ["driver-history"],
    queryFn: () => apiClient.get<any[]>("/deliveries/history"),
  });
  const trips = (data as any[]) ?? [];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Orders History</h1>
        <p className="text-sm opacity-60">{trips.length} completed {trips.length === 1 ? "trip" : "trips"}</p>
      </div>

      {isLoading && <p className="opacity-60 text-sm">Loading...</p>}

      {!isLoading && trips.length === 0 && (
        <div className="d3-card p-8 text-center opacity-60 text-sm">No completed trips yet.</div>
      )}

      <div className="space-y-3">
        {trips.map((d) => (
          <div key={d.id} className="d3-card d3-card-hover p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold">Order #{d.orderId.slice(0, 8)}</div>
                <div className="text-sm opacity-70">{d.restaurantName ?? "Restaurant"}</div>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{ background: "var(--portal-primary)", color: "white" }}
              >
                Completed
              </span>
            </div>

            {d.items?.length > 0 && (
              <div className="text-xs opacity-70 mb-2 space-y-0.5">
                {d.items.map((i: any, idx: number) => (
                  <div key={idx}>
                    {i.quantity} × {i.name}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end justify-between pt-2 border-t" style={{ borderColor: "var(--portal-border)" }}>
              <div>
                <div className="text-[10px] opacity-50">
                  {new Date(d.deliveredAt ?? d.updatedAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                {d.orderTotal != null && (
                  <div className="text-xs opacity-60">Order total ₹{Number(d.orderTotal).toFixed(0)}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] opacity-60">Your earning</div>
                <div className="font-bold text-lg" style={{ color: "var(--portal-primary)" }}>
                  ₹{d.earning.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
