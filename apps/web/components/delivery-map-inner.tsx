"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";

export interface MapPoint {
  lat: number;
  lng: number;
}

// Custom emoji divIcons instead of Leaflet's default marker image — this app
// already uses emoji as its whole icon language everywhere else (no icon
// library anywhere in the codebase), and it sidesteps the well-known
// Leaflet+bundler issue where the default marker PNG fails to resolve.
function emojiIcon(emoji: string, bg: string) {
  return L.divIcon({
    html: `<div style="font-size:18px;line-height:30px;width:30px;height:30px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid white;">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const RESTAURANT_ICON = emojiIcon("🏪", "#00b894");
const CUSTOMER_ICON = emojiIcon("📍", "#e74040");
const DRIVER_ICON = emojiIcon("🛵", "#641C32");

export function DeliveryMapInner({
  restaurant,
  destination,
  driver,
  height,
}: {
  restaurant?: MapPoint | null;
  destination?: MapPoint | null;
  driver?: MapPoint | null;
  height: number;
}) {
  const points = [restaurant, destination, driver].filter((p): p is MapPoint => !!p);
  const center = driver ?? restaurant ?? destination ?? { lat: 12.9716, lng: 77.5946 };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ height, border: "1px solid var(--qb-border)" }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={points.length > 1 ? 13 : 14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {restaurant && <Marker position={[restaurant.lat, restaurant.lng]} icon={RESTAURANT_ICON} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={CUSTOMER_ICON} />}
        {driver && <Marker position={[driver.lat, driver.lng]} icon={DRIVER_ICON} />}
        {driver && destination && (
          <Polyline
            positions={[
              [driver.lat, driver.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: "#641C32", weight: 3, dashArray: "6 6" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
