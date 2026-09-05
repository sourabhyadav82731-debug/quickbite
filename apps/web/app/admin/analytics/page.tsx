"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

function money(n: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function RevenueAnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-analytics", range, from, to],
    queryFn: () => api.admin.revenueAnalytics(range, range === "custom" ? from : undefined, range === "custom" ? to : undefined),
    enabled: range !== "custom" || (!!from && !!to),
  });
  const d = data as any;

  const maxRevenue = Math.max(1, ...((d?.series ?? []).map((s: any) => s.revenue)));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Revenue Analytics</h1>

      <div className="flex flex-wrap gap-2 items-center">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`qb-admin-badge px-3 py-1.5 ${range === r.value ? "qb-admin-badge-primary" : ""}`}
          >
            {r.label}
          </button>
        ))}
        {range === "custom" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="glass-card px-2 py-1.5 text-sm" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="glass-card px-2 py-1.5 text-sm" />
          </>
        )}
      </div>

      {isLoading && <p className="text-sm opacity-60">Loading…</p>}

      {d && (
        <>
          <div className="qb-admin-kpi-card">
            <h2 className="font-semibold text-sm mb-3">Daily Revenue &amp; Orders</h2>
            {d.series.length === 0 ? (
              <p className="text-xs opacity-60">No delivered orders in this range.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {d.series.map((s: any) => (
                  <div key={s.day} className="flex-1 flex flex-col items-center gap-1" title={`${s.day}: ${money(s.revenue)} (${s.orders} orders)`}>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max(4, (s.revenue / maxRevenue) * 140)}px`,
                        background: "linear-gradient(180deg, var(--qb-primary), var(--qb-secondary))",
                        boxShadow: "0 0 10px rgba(100, 28, 50, 0.4)",
                      }}
                    />
                    <span className="text-[9px] opacity-50 rotate-0">{s.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Kpi label="Gross Order Value" value={money(d.breakdown.grossOrderValue)} />
            <Kpi label="Platform Commission" value={money(d.breakdown.platformCommission)} accent="primary" />
            <Kpi label="Restaurant Share" value={money(d.breakdown.restaurantShare)} />
            <Kpi label="Driver Delivery Fees" value={money(d.breakdown.driverDeliveryFees)} />
            <Kpi label="Refunds" value={money(d.breakdown.refunds)} accent="error" />
            <Kpi label="Net Platform Revenue" value={money(d.breakdown.netPlatformRevenue)} accent="success" />
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "error" }) {
  const color = accent ? { primary: "var(--qb-primary)", success: "#6FAE7F", error: "#C0605F" }[accent] : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
