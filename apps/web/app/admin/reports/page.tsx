"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function FinancialReportsPage() {
  const [from, setFrom] = useState(isoDate(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(isoDate(new Date()));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-financial-report", from, to],
    queryFn: () => api.admin.financialReport(from, to),
    enabled: !!from && !!to,
  });
  const d = data as any;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold">Financial Reports</h1>
      <p className="text-xs opacity-60">
        Structured for CSV export in a future pass — every figure here is computed live from
        delivered orders, driver deliveries, refunds, and settlement records for the selected range.
      </p>

      <div className="flex gap-2 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="glass-card px-3 py-2 text-sm" />
        <span className="opacity-50 text-sm">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="glass-card px-3 py-2 text-sm" />
      </div>

      {isLoading && <p className="text-sm opacity-60">Loading…</p>}

      {d && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Kpi label="GMV" value={money(d.gmv)} />
          <Kpi label="Platform Revenue" value={money(d.platformRevenue)} accent="primary" />
          <Kpi label="Restaurant Revenue" value={money(d.restaurantRevenue)} />
          <Kpi label="Driver Earnings" value={money(d.driverEarnings)} />
          <Kpi label="Delivery Fees" value={money(d.deliveryFees)} />
          <Kpi label="Discounts" value={money(d.discounts)} />
          <Kpi label="Refunds" value={money(d.refunds)} accent="error" />
          <Kpi label="Net Revenue" value={money(d.netRevenue)} accent="success" />
          <Kpi label="Pending Settlements" value={money(d.pendingSettlements)} accent="warning" />
          <Kpi label="Completed Settlements" value={money(d.completedSettlements)} />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "error" | "warning" }) {
  const color = accent
    ? { primary: "var(--qb-primary)", success: "#6FAE7F", error: "#C0605F", warning: "#A67C00" }[accent]
    : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
