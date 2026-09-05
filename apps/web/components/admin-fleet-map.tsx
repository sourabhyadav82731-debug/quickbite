"use client";

import dynamic from "next/dynamic";

const AdminFleetMapInner = dynamic(
  () => import("./admin-fleet-map-inner").then((m) => m.AdminFleetMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl flex items-center justify-center text-xs opacity-60"
        style={{ height: 320, background: "var(--qb-elevated)" }}
      >
        Loading map…
      </div>
    ),
  },
);

/** Every active delivery's live (or last-known) driver position, plotted on
 *  one map. `deliveries` is exactly the array admin.activeDeliveries()
 *  returns (each entry may have liveLat/liveLng from a socket update, else
 *  falls back to driverLocation.currentLat/Lng from that same fetch — never
 *  a 0,0 placeholder for a driver with no position yet, those are just
 *  skipped). */
export function AdminFleetMap({
  deliveries,
  selectedId,
  onSelect,
}: {
  deliveries: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const points = deliveries
    .map((d) => {
      const lat = d.liveLat ?? d.driverLocation?.currentLat;
      const lng = d.liveLng ?? d.driverLocation?.currentLng;
      if (lat == null || lng == null) return null;
      return { id: d.id, lat, lng };
    })
    .filter((p): p is { id: string; lat: number; lng: number } => !!p);

  if (points.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-xs opacity-60"
        style={{ height: 320, background: "var(--qb-elevated)" }}
      >
        No live driver positions yet.
      </div>
    );
  }

  return <AdminFleetMapInner points={points} selectedId={selectedId} onSelect={onSelect} height={320} />;
}
