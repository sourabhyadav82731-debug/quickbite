"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { connectDeliverySocket } from "@/lib/socket";

export default function LiveMapPage() {
  const { data } = useQuery({
    queryKey: ["admin-active-deliveries"],
    queryFn: () => apiClient.get<any[]>("/admin/deliveries/active"),
  });
  const [deliveries, setDeliveries] = useState<any[]>([]);

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
        prev.map((x) => (x.id === loc.deliveryId ? { ...x, liveLat: loc.lat, liveLng: loc.lng } : x)),
      );
    });
    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Live GPS Fleet Radar</h1>
      <p className="text-xs opacity-60">
        Positions plotted from live driver pings — a real map tile provider is planned for a
        future pass.
      </p>

      <div className="glass-card p-4 relative" style={{ height: 360 }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="var(--portal-border)" opacity="0.3" />
          {deliveries.map((d) => {
            const lat = d.liveLat ?? d.driverLocation?.currentLat ?? 12.97;
            const lng = d.liveLng ?? d.driverLocation?.currentLng ?? 77.6;
            const x = ((lng - 77.55) / 0.1) * 100;
            const y = ((13.0 - lat) / 0.06) * 100;
            return (
              <g key={d.id}>
                <circle cx={Math.min(96, Math.max(4, x))} cy={Math.min(96, Math.max(4, y))} r="3" fill="var(--portal-primary)" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-2">
        {deliveries.map((d) => (
          <div key={d.id} className="glass-card p-3 flex items-center justify-between text-sm">
            <span>Order #{d.orderId.slice(0, 8)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full glass-card">{d.stage.replace(/_/g, " ")}</span>
          </div>
        ))}
        {deliveries.length === 0 && <p className="opacity-60 text-sm">No active deliveries right now.</p>}
      </div>
    </div>
  );
}
