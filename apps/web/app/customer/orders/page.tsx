"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@quickbite/types";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";

const ACTIVE_STATUSES = [
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.ON_THE_WAY,
];

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.orders.list(),
    refetchInterval: 10000,
  });

  const list = (orders as any[]) ?? [];
  const active = list.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const past = list.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  function reorder(order: any) {
    const store = useCartStore.getState();
    store.clear();
    for (const item of order.items) {
      store.addItem(order.restaurantId, "", {
        dishId: item.dishId,
        name: item.nameSnapshot,
        unitPrice: item.unitPriceSnapshot,
        addons: item.addons,
        quantity: item.quantity,
      });
    }
    router.push("/customer/cart");
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <section>
        <h2 className="text-lg font-bold mb-3">Active Orders</h2>
        {active.length === 0 && <p className="opacity-60 text-sm">No active orders.</p>}
        <div className="space-y-2">
          {active.map((o) => (
            <Link key={o.id} href={`/customer/orders/${o.id}`} className="glass-card p-4 flex items-center justify-between text-sm block">
              <div>
                <div className="font-semibold">Order #{o.id.slice(0, 8)}</div>
                <div className="opacity-60 text-xs">{o.status.replace(/_/g, " ")}</div>
              </div>
              <div className="font-bold">₹{o.grandTotal.toFixed(0)}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Order History</h2>
        <div className="space-y-2">
          {past.map((o) => (
            <div key={o.id} className="glass-card p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">Order #{o.id.slice(0, 8)}</div>
                  <div className="opacity-60 text-xs">
                    {o.status} · {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-bold">₹{o.grandTotal.toFixed(0)}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/customer/orders/${o.id}`} className="text-xs underline opacity-70">
                  View details
                </Link>
                <button onClick={() => reorder(o)} className="text-xs underline" style={{ color: "var(--portal-primary)" }}>
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
