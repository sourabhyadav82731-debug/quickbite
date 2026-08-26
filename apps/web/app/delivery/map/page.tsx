"use client";

import { SURGE_MULTIPLIERS } from "@quickbite/config";

const HOTSPOTS = [
  { x: 30, y: 40, intensity: "HIGH" as const },
  { x: 55, y: 25, intensity: "MEDIUM" as const },
  { x: 70, y: 60, intensity: "HIGH" as const },
  { x: 45, y: 70, intensity: "LOW" as const },
  { x: 20, y: 65, intensity: "MEDIUM" as const },
];

const COLORS: Record<string, string> = {
  LOW: "#2E86FF55",
  MEDIUM: "#FFB53499",
  HIGH: "#E74C3CCC",
};

export default function HeatmapPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Live Demand Heatmap</h1>
      <p className="text-xs opacity-60">
        Simulated hotspot data — a real GPS/maps provider integration is planned for a future
        pass.
      </p>

      <div className="glass-card p-2 relative" style={{ aspectRatio: "1", overflow: "hidden" }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="var(--portal-border)" opacity="0.3" />
          {HOTSPOTS.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r={h.intensity === "HIGH" ? 12 : h.intensity === "MEDIUM" ? 9 : 6} fill={COLORS[h.intensity]} />
          ))}
        </svg>
      </div>

      <div className="flex gap-4 text-xs">
        {Object.entries(SURGE_MULTIPLIERS).map(([key, mult]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[key] ?? "var(--portal-border)" }} />
            {key}: {mult}x
          </div>
        ))}
      </div>
    </div>
  );
}
