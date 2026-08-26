"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { OrderStatus } from "@quickbite/types";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { connectOrdersSocket } from "@/lib/socket";

const COLUMNS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "incoming", label: "Incoming Requests", statuses: [OrderStatus.PLACED] },
  { key: "preparing", label: "In Preparation", statuses: [OrderStatus.ACCEPTED, OrderStatus.PREPARING] },
  { key: "ready", label: "Ready for Pickup", statuses: [OrderStatus.READY_FOR_PICKUP] },
  {
    key: "done",
    label: "Completed / Dispatched",
    statuses: [OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED],
  },
];

export default function KitchenPage() {
  const { active } = useRestaurant();
  const [orders, setOrders] = useState<any[]>([]);
  const prevCount = useRef(0);

  const { data } = useQuery({
    queryKey: ["kitchen-orders", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active.id}`),
    enabled: !!active,
  });

  useEffect(() => {
    if (data) setOrders(data as any[]);
  }, [data]);

  useEffect(() => {
    if (!active) return;
    const socket = connectOrdersSocket();
    socket?.emit("restaurant.subscribeKitchen", { restaurantId: active.id });
    socket?.on("order.created", (order: any) => {
      if (order.restaurantId === active.id) setOrders((prev) => [order, ...prev]);
    });
    socket?.on("kitchen.ticketUpdate", (order: any) => {
      if (order.restaurantId === active.id) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === order.id);
          return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev];
        });
      }
    });
    return () => {
      socket?.disconnect();
    };
  }, [active]);

  useEffect(() => {
    const incoming = orders.filter((o) => o.status === OrderStatus.PLACED).length;
    if (incoming > prevCount.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 150);
      } catch {}
    }
    prevCount.current = incoming;
  }, [orders]);

  async function advance(orderId: string, status: OrderStatus) {
    await api.orders.updateStatus(orderId, { status });
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <div key={col.key} className="space-y-3">
          <h2 className="font-bold text-sm sticky top-16">{col.label}</h2>
          {orders
            .filter((o) => col.statuses.includes(o.status))
            .map((o) => (
              <div key={o.id} className="glass-card p-3 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">#{o.id.slice(0, 6)}</span>
                  <span className="text-xs opacity-60">{o.items?.length ?? "-"} items</span>
                </div>
                {o.specialInstructions && (
                  <p className="text-xs italic opacity-60 mb-1">"{o.specialInstructions}"</p>
                )}
                <div className="text-xs opacity-50 mb-2">₹{o.grandTotal.toFixed(0)}</div>
                {o.status === OrderStatus.PLACED && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => advance(o.id, OrderStatus.ACCEPTED)}
                      className="portal-btn-primary px-2 py-1 text-xs flex-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => advance(o.id, OrderStatus.CANCELLED)}
                      className="px-2 py-1 text-xs flex-1 rounded-lg text-red-500 glass-card"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {o.status === OrderStatus.ACCEPTED && (
                  <button
                    onClick={() => advance(o.id, OrderStatus.PREPARING)}
                    className="portal-btn-primary px-2 py-1 text-xs w-full"
                  >
                    Start Preparing
                  </button>
                )}
                {o.status === OrderStatus.PREPARING && (
                  <button
                    onClick={() => advance(o.id, OrderStatus.READY_FOR_PICKUP)}
                    className="portal-btn-primary px-2 py-1 text-xs w-full"
                  >
                    Food Ready
                  </button>
                )}
                {o.status === OrderStatus.READY_FOR_PICKUP && (
                  <p className="text-xs opacity-60">Waiting for pickup...</p>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
