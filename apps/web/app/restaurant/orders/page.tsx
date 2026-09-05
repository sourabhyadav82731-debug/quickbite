"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderStatus } from "@quickbite/types";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PLACED]: "#e17055",
  [OrderStatus.ACCEPTED]: "#fdcb6e",
  [OrderStatus.PREPARING]: "#fdcb6e",
  [OrderStatus.READY_FOR_PICKUP]: "#0984e3",
  [OrderStatus.DELIVERED]: "#00b894",
  [OrderStatus.CANCELLED]: "#e74040",
};

// GET /orders?restaurantId=X doesn't include line items — GET /orders/:id
// (existing, unchanged) does. Cached indefinitely: items never change after
// an order is placed.
function useOrderItems(orderId: string) {
  const { data } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: () => api.orders.get(orderId),
    staleTime: Infinity,
  });
  return (data as any)?.items as
    | { nameSnapshot: string; quantity: number; restaurantPriceSnapshot: number }[]
    | undefined;
}

export default function RestaurantOrdersPage() {
  const { active } = useRestaurant();
  const { data: orders } = useQuery({
    queryKey: ["restaurant-orders-all", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active.id}`),
    enabled: !!active,
  });

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const list = (orders as any[]) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm opacity-60">Complete order history for {active.name}.</p>
      </div>

      {list.length === 0 && <div className="d3-card p-8 text-center opacity-60 text-sm">No orders yet.</div>}

      <div className="space-y-3">
        {list.map((o) => (
          <OrderHistoryCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}

function OrderHistoryCard({ order: o }: { order: any }) {
  const items = useOrderItems(o.id);

  return (
    <div className="d3-card d3-card-hover p-4">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <div className="font-semibold">#{o.id.slice(0, 8)}</div>
          <div className="text-xs opacity-50">
            {new Date(o.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {o.paymentMethod}
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full text-white whitespace-nowrap"
          style={{ background: STATUS_COLOR[o.status as OrderStatus] ?? "#636e72" }}
        >
          {o.status.replace(/_/g, " ")}
        </span>
      </div>

      {items && items.length > 0 && (
        <div className="text-xs opacity-70 my-2 space-y-0.5">
          {items.map((it, idx) => (
            <div key={idx}>
              {it.quantity} × {it.nameSnapshot}{" "}
              <span className="opacity-50">(₹{it.restaurantPriceSnapshot} ea)</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t text-sm" style={{ borderColor: "var(--portal-border)" }}>
        <span className="text-xs opacity-60">Customer Paid</span>
        <span className="font-bold">₹{o.grandTotal.toFixed(0)}</span>
      </div>
    </div>
  );
}
