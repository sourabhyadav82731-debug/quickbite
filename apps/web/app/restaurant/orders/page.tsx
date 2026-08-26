"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function RestaurantOrdersPage() {
  const { active } = useRestaurant();
  const { data: orders } = useQuery({
    queryKey: ["restaurant-orders-all", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active.id}`),
    enabled: !!active,
  });

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="text-xl font-bold mb-2">Order History</h1>
      {((orders as any[]) ?? []).map((o) => (
        <div key={o.id} className="glass-card p-4 flex items-center justify-between text-sm">
          <div>
            <div className="font-semibold">#{o.id.slice(0, 8)}</div>
            <div className="opacity-60 text-xs">
              {o.status.replace(/_/g, " ")} · {new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}
            </div>
          </div>
          <div className="font-bold">₹{o.grandTotal.toFixed(0)}</div>
        </div>
      ))}
    </div>
  );
}
