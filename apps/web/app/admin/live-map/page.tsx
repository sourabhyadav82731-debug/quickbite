"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { connectDeliverySocket } from "@/lib/socket";
import { AdminFleetMap } from "@/components/admin-fleet-map";

export default function LiveMapPage() {
  const { data } = useQuery({
    queryKey: ["admin-active-deliveries"],
    queryFn: () => apiClient.get<any[]>("/admin/deliveries/active"),
    refetchInterval: 15000,
  });
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setDeliveries(data as any[]);
  }, [data]);

  useEffect(() => {
    const socket = connectDeliverySocket();
    socket?.emit("admin.subscribeMap", {});
    socket?.on("delivery.assigned", (d: any) => {
      setDeliveries((prev) => {
        const exists = prev.some((x) => x.id === d.id);
        return exists ? prev.map((x) => (x.id === d.id ? { ...x, ...d } : x)) : [...prev, d];
      });
    });
    socket?.on("delivery.stageChanged", (d: any) => {
      setDeliveries((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...d } : x)));
    });
    socket?.on("delivery.locationChanged", (loc: any) => {
      setDeliveries((prev) =>
        prev.map((x) =>
          x.id === loc.deliveryId
            ? { ...x, liveLat: loc.lat, liveLng: loc.lng, liveUpdatedAt: loc.updatedAt }
            : x,
        ),
      );
    });
    return () => {
      socket?.disconnect();
    };
  }, []);

  const activeDrivers = useMemo(
    () => new Set(deliveries.map((d) => d.driverId).filter(Boolean)).size,
    [deliveries],
  );
  const selected = deliveries.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Live Deliveries</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="d3-card p-4 text-center">
          <div className="text-2xl font-bold">{deliveries.length}</div>
          <div className="text-xs opacity-60">Active Deliveries</div>
        </div>
        <div className="d3-card p-4 text-center">
          <div className="text-2xl font-bold">{activeDrivers}</div>
          <div className="text-xs opacity-60">Active Drivers</div>
        </div>
      </div>

      <AdminFleetMap
        deliveries={deliveries}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      {selected && (
        <div className="d3-card p-4 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Order #{selected.orderId.slice(0, 8)}</span>
            <button onClick={() => setSelectedId(null)} className="text-xs opacity-60">
              ✕ Close
            </button>
          </div>
          <div className="opacity-70 text-xs">
            Driver: {selected.driverId ? selected.driverId.slice(0, 8) : "Unassigned"}
          </div>
          <div className="opacity-70 text-xs">Status: {selected.stage.replace(/_/g, " ")}</div>
          {selected.liveUpdatedAt && (
            <div className="opacity-50 text-[10px]">
              Last updated: {new Date(selected.liveUpdatedAt).toLocaleTimeString("en-IN")}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {deliveries.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedId(d.id)}
            className="w-full glass-card p-3 flex items-center justify-between text-sm text-left"
          >
            <span>Order #{d.orderId.slice(0, 8)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full glass-card">{d.stage.replace(/_/g, " ")}</span>
          </button>
        ))}
        {deliveries.length === 0 && <p className="opacity-60 text-sm">No active deliveries right now.</p>}
      </div>
    </div>
  );
}
