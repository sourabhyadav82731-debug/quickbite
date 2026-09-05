"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number | undefined) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.admin.dashboard(),
    refetchInterval: 15000,
  });
  const d = data as any;
  const kpis = d?.kpis;
  const fin = d?.financials;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Admin Control Center</h1>
        <p className="text-xs opacity-60 mt-1">
          Every figure below is computed live from the orders, payments, and settlement ledgers —
          nothing on this page is hardcoded.
        </p>
      </div>

      {isLoading && <p className="text-sm opacity-60">Loading live metrics…</p>}

      {kpis && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide opacity-60">Key Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Kpi label="Total Revenue" value={money(kpis.totalRevenue)} />
            <Kpi label="Today's Revenue" value={money(kpis.todayRevenue)} />
            <Kpi label="Total Orders" value={kpis.totalOrders} />
            <Kpi label="Today's Orders" value={kpis.todayOrders} />
            <Kpi label="Active Orders" value={kpis.activeOrders} accent="info" />
            <Kpi label="Completed Orders" value={kpis.completedOrders} accent="success" />
            <Kpi label="Cancelled Orders" value={kpis.cancelledOrders} accent="error" />
            <Kpi label="Refunded Orders" value={kpis.refundedOrders} accent="warning" />
            <Kpi label="Total Customers" value={kpis.totalCustomers} />
            <Kpi label="Active Restaurants" value={kpis.activeRestaurants} />
            <Kpi label="Online Drivers" value={kpis.onlineDrivers} accent="success" />
          </div>
        </section>
      )}

      {fin && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide opacity-60">Financials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Kpi label="Restaurant Payable" value={money(fin.restaurantPayable)} sub="owed, net of paid-out settlements" />
            <Kpi label="Driver Payable" value={money(fin.driverPayable)} sub="owed, net of paid-out payouts" />
            <Kpi label="Platform Revenue" value={money(fin.platformRevenue)} accent="primary" />
            <Kpi label="Pending Settlements" value={money(fin.pendingSettlements)} accent="warning" />
            <Kpi label="Pending Driver Payouts" value={money(fin.pendingDriverPayouts)} accent="warning" />
            <Kpi label="Refund Amount" value={money(fin.refundAmount)} accent="error" />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide opacity-60">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/orders" label="All Orders" />
          <QuickLink href="/admin/returns" label="Returns & Refunds" />
          <QuickLink href="/admin/analytics" label="Revenue Analytics" />
          <QuickLink href="/admin/live-map" label="Live Deliveries" />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "success" | "warning" | "error" | "info";
}) {
  const color = accent
    ? {
        primary: "var(--qb-primary)",
        success: "#6FAE7F",
        warning: "#A67C00",
        error: "#C0605F",
        info: "#7A2940",
      }[accent]
    : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="qb-admin-kpi-sub">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="qb-admin-badge qb-admin-badge-primary px-3 py-1.5">
      {label} →
    </Link>
  );
}
