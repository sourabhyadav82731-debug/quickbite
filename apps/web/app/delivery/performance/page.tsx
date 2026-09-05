"use client";

import { useQuery } from "@tanstack/react-query";
import { api, apiClient } from "@/lib/api";

export default function PerformancePage() {
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const { data: earnings } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });

  const p = profile as any;
  const e = earnings as any;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Performance &amp; Rating</h1>
        <p className="text-sm opacity-60">Real metrics from your own delivery history.</p>
      </div>

      <div className="d3-hero p-6 text-center">
        <div className="text-xs opacity-80 mb-1">Average Rating</div>
        <div className="text-4xl font-bold mb-1">
          {p?.rating != null ? `★ ${p.rating.toFixed(1)}` : "Not available yet"}
        </div>
        {p?.ratingCount != null && <div className="text-xs opacity-80">from {p.ratingCount} customer ratings</div>}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MetricBar
          label="Acceptance Rate"
          value={p?.acceptanceRate}
          hint="Share of delivery offers you accepted"
        />
        <MetricBar
          label="On-Time Performance"
          value={p?.onTimeRate}
          hint="Deliveries completed within the estimated window"
        />
        <MetricBar
          label="Cancellation Rate"
          value={null}
          hint="Not tracked by the backend yet"
        />
      </div>

      <div className="d3-card d3-card-hover p-4 flex items-center justify-between">
        <div>
          <div className="text-xs opacity-60 mb-0.5">Completed Deliveries</div>
          <div className="text-xl font-bold">{e?.tripsCompleted ?? "Not available yet"}</div>
        </div>
        <div className="d3-icon-badge">📦</div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, hint }: { label: string; value: number | null | undefined; hint: string }) {
  const known = typeof value === "number";
  const pct = known ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="d3-card p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold" style={known ? { color: "var(--portal-primary)" } : { opacity: 0.5 }}>
          {known ? `${value.toFixed(0)}%` : "Not available yet"}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--portal-border)" }}>
        {known && (
          <div
            className="h-2 rounded-full"
            style={{ width: `${pct}%`, background: "var(--portal-primary)" }}
          />
        )}
      </div>
      <div className="text-[11px] opacity-50 mt-1">{hint}</div>
    </div>
  );
}
