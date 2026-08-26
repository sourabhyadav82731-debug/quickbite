"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { connectOrdersSocket } from "@/lib/socket";

export default function AdminOrdersPage() {
  const { data } = useQuery({ queryKey: ["admin-orders"], queryFn: () => api.admin.orders() });
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (data) setOrders(data as any[]);
  }, [data]);

  useEffect(() => {
    const socket = connectOrdersSocket();
    socket?.emit("admin.subscribeLedger", {});
    socket?.on("order.created", (o: any) => setOrders((prev) => [o, ...prev]));
    socket?.on("order.statusChanged", (o: any) =>
      setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x))),
    );
    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Central Orders Ledger</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="glass-card p-3 flex items-center justify-between text-sm">
            <span>#{o.id.slice(0, 8)} · {o.status.replace(/_/g, " ")}</span>
            <span className="font-bold">₹{o.grandTotal.toFixed(0)}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="opacity-60 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
