"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

function scooterIcon(highlighted: boolean) {
  return L.divIcon({
    html: `<div style="font-size:16px;line-height:28px;width:28px;height:28px;border-radius:50%;background:${
      highlighted ? "#641C32" : "#2A1620"
    };display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid ${
      highlighted ? "#ffffff" : "#641C32"
    };">🛵</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface FleetPoint {
  id: string;
  lat: number;
  lng: number;
}

export function AdminFleetMapInner({
  points,
  selectedId,
  onSelect,
  height,
}: {
  points: FleetPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height: number;
}) {
  const center = points[0] ?? { lat: 12.9716, lng: 77.5946 };

  return (
    <div className="rounded-xl overflow-hidden" style={{ height, border: "1px solid var(--qb-border)" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={scooterIcon(p.id === selectedId)}
            eventHandlers={{ click: () => onSelect(p.id) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
