"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { OrderStatus } from "@quickbite/types";
import { api, friendlyErrorMessage } from "@/lib/api";
import { connectOrdersSocket } from "@/lib/socket";

/** Shared by the Kitchen board and the Dashboard's compact live-orders panel
 *  — same realtime subscription, same in-flight-dedupe on status updates,
 *  same "ding" on a genuinely new incoming order. Extracted so both surfaces
 *  read the exact same live order list rather than keeping two independent
 *  copies of this logic in sync by hand. */
export function useLiveOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<any[]>([]);
  const prevCount = useRef(0);
  const [advancingIds, setAdvancingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["kitchen-orders", restaurantId],
    queryFn: () => api.orders.list(`?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (data) setOrders(data as any[]);
  }, [data]);

  useEffect(() => {
    if (!restaurantId) return;
    const socket = connectOrdersSocket();
    socket?.emit("restaurant.subscribeKitchen", { restaurantId });
    socket?.on("order.created", (order: any) => {
      if (order.restaurantId === restaurantId) setOrders((prev) => [order, ...prev]);
    });
    socket?.on("kitchen.ticketUpdate", (order: any) => {
      if (order.restaurantId === restaurantId) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === order.id);
          return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev];
        });
      }
    });
    return () => {
      socket?.disconnect();
    };
  }, [restaurantId]);

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
    if (advancingIds.has(orderId)) return;
    setAdvancingIds((prev) => new Set(prev).add(orderId));
    setError(null);
    try {
      await api.orders.updateStatus(orderId, { status });
    } catch (err: any) {
      setError(friendlyErrorMessage(err, "Could not update the order. Please try again."));
    } finally {
      setAdvancingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  return { orders, advance, advancingIds, error, setError };
}
