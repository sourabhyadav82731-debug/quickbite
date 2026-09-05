"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./delivery-map-inner";

// Leaflet touches `window` at module scope, so this can never be part of the
// server-rendered HTML — ssr:false is load-bearing here, not an optimization.
const DeliveryMapInner = dynamic(
  () => import("./delivery-map-inner").then((m) => m.DeliveryMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl flex items-center justify-center text-xs opacity-60"
        style={{ height: 220, background: "var(--qb-elevated)" }}
      >
        Loading map…
      </div>
    ),
  },
);

/** Restaurant/customer/driver markers over OpenStreetMap tiles (no API key —
 *  the free, no-paid-account tile source) — shared by the customer tracking
 *  page, driver active-delivery page, and admin live map. `driver` is `null`
 *  (not just omitted) when a real coordinate genuinely isn't available yet,
 *  so callers never have to invent a 0,0 placeholder to satisfy this prop. */
export function DeliveryMap({
  restaurant,
  destination,
  driver,
  height = 220,
}: {
  restaurant?: MapPoint | null;
  destination?: MapPoint | null;
  driver?: MapPoint | null;
  height?: number;
}) {
  if (!restaurant && !destination && !driver) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-xs opacity-60 text-center px-4"
        style={{ height, background: "var(--qb-elevated)" }}
      >
        Location temporarily unavailable
      </div>
    );
  }
  return <DeliveryMapInner restaurant={restaurant} destination={destination} driver={driver} height={height} />;
}
