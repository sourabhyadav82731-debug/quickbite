"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderStatus } from "@quickbite/types";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

const TERMINAL = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

export default function RestaurantDashboard() {
  const { active } = useRestaurant();
  const { data: orders } = useQuery({
    queryKey: ["restaurant-orders", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active.id}`),
    enabled: !!active,
    refetchInterval: 8000,
  });

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const list = (orders as any[]) ?? [];
  const today = new Date().toDateString();
  const todaysOrders = list.filter((o) => new Date(o.createdAt).toDateString() === today);
  const revenue = todaysOrders.reduce((s, o) => s + o.itemTotal, 0);
  const activeOrders = list.filter((o) => !TERMINAL.includes(o.status));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{active.name} — Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Kpi label="Today's Revenue" value={`₹${revenue.toFixed(0)}`} />
        <Kpi label="Active Orders" value={activeOrders.length} />
        <Kpi label="Avg Prep Time" value={`${active.avgPrepTimeMinutes}m`} />
        <Kpi label="Rating" value={`★ ${active.rating.toFixed(1)}`} />
        <Kpi label="Orders Today" value={todaysOrders.length} />
      </div>

      <section>
        <h2 className="font-bold mb-3">Recent Orders</h2>
        <div className="space-y-2">
          {list.slice(0, 8).map((o) => (
            <div key={o.id} className="glass-card p-3 flex items-center justify-between text-sm">
              <span>#{o.id.slice(0, 8)} · {o.status.replace(/_/g, " ")}</span>
              <span className="font-bold">₹{o.grandTotal.toFixed(0)}</span>
            </div>
          ))}
          {list.length === 0 && <p className="opacity-60 text-sm">No orders yet.</p>}
        </div>
      </section>
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
