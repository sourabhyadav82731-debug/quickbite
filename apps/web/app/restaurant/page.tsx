"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { OrderStatus } from "@quickbite/types";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { useLiveOrders } from "@/lib/use-live-orders";
import { AvailabilityControl } from "@/components/availability-control";
import { RevenueChart, RevenueDay } from "@/components/revenue-chart";

const LIVE_STATUSES = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACTION_LABEL: Partial<Record<OrderStatus, { next: OrderStatus; label: string }[]>> = {
  [OrderStatus.PLACED]: [
    { next: OrderStatus.ACCEPTED, label: "Accept" },
    { next: OrderStatus.CANCELLED, label: "Reject" },
  ],
  [OrderStatus.ACCEPTED]: [{ next: OrderStatus.PREPARING, label: "Start Preparing" }],
  [OrderStatus.PREPARING]: [{ next: OrderStatus.READY_FOR_PICKUP, label: "Mark Ready" }],
};

export default function RestaurantDashboard() {
  const { active } = useRestaurant();
  const { data: orders } = useQuery({
    queryKey: ["restaurant-orders", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active.id}`),
    enabled: !!active,
    refetchInterval: 15000,
  });
  const { data: balance } = useQuery({
    queryKey: ["restaurant-wallet-balance", active?.id],
    queryFn: () => api.withdrawals.restaurantBalance(active.id),
    enabled: !!active,
  });
  const { data: activeDeliveries } = useQuery({
    queryKey: ["restaurant-active-deliveries", active?.id],
    queryFn: () => api.delivery.activeForRestaurant(active.id),
    enabled: !!active,
    refetchInterval: 15000,
  });
  const { orders: liveOrders, advance, advancingIds, error, setError } = useLiveOrders(active?.id);

  const list = (orders as any[]) ?? [];

  const analytics = useMemo(() => {
    const delivered = list.filter((o) => o.status === OrderStatus.DELIVERED);
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7)); // Monday-start, matches DeliveryService
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(todayStart.getDate() - 6);
    const fourteenDaysAgo = new Date(todayStart);
    fourteenDaysAgo.setDate(todayStart.getDate() - 13);

    const sum = (rows: any[]) => rows.reduce((s, o) => s + o.itemTotal, 0);
    const byUpdatedSince = (since: Date) => delivered.filter((o) => new Date(o.updatedAt) >= since);

    const totalRevenue = sum(delivered);
    const todayRevenue = sum(byUpdatedSince(todayStart));
    const weekRevenue = sum(byUpdatedSince(weekStart));
    const monthRevenue = sum(byUpdatedSince(monthStart));
    const last7 = byUpdatedSince(sevenDaysAgo);
    const prev7 = delivered.filter(
      (o) => new Date(o.updatedAt) >= fourteenDaysAgo && new Date(o.updatedAt) < sevenDaysAgo,
    );
    const last7Revenue = sum(last7);
    const prev7Revenue = sum(prev7);
    const trendPct = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100 : null;

    // Acceptance rate: of orders that actually reached the restaurant
    // (i.e. payment already went through), what fraction were NOT
    // cancelled. PAYMENT_PENDING is excluded since the restaurant never
    // acted on those. Documented here rather than just computed, since the
    // order model has no explicit "who cancelled" field to be more precise
    // than that.
    const relevant = list.filter((o) => o.status !== OrderStatus.PAYMENT_PENDING);
    const accepted = relevant.filter((o) => o.status !== OrderStatus.CANCELLED);
    const acceptanceRate = relevant.length > 0 ? (accepted.length / relevant.length) * 100 : null;

    const dailyRevenue: RevenueDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart);
      day.setDate(todayStart.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setDate(day.getDate() + 1);
      const dayOrders = delivered.filter((o) => {
        const t = new Date(o.updatedAt);
        return t >= day && t < dayEnd;
      });
      dailyRevenue.push({
        date: isoDate(day),
        label: DAY_LABELS[day.getDay()],
        revenue: sum(dayOrders),
        orderCount: dayOrders.length,
      });
    }

    return {
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      last7Revenue,
      trendPct,
      acceptanceRate,
      dailyRevenue,
      newCount: list.filter((o) => o.status === OrderStatus.PLACED).length,
      preparingCount: list.filter((o) =>
        [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status),
      ).length,
      readyCount: list.filter((o) => o.status === OrderStatus.READY_FOR_PICKUP).length,
    };
  }, [list]);

  const b = balance as any;
  const liveActionable = liveOrders.filter((o) => LIVE_STATUSES.includes(o.status));
  const recent = [...list]
    .sort((a, b2) => new Date(b2.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const deliveries = (activeDeliveries as any[]) ?? [];

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="d3-hero p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}, {active.name}</h1>
          <p className="text-sm opacity-80">Here's what's happening with your restaurant today.</p>
        </div>
        <AvailabilityControl restaurant={active} />
        <div className="flex gap-2 flex-wrap pt-1">
          <Link href="/restaurant/orders" className="d3-btn bg-white text-xs font-semibold px-3.5 py-2 rounded-xl" style={{ color: "var(--portal-primary)", minHeight: 44 }}>
            View Live Orders
          </Link>
        </div>
      </div>

      {/* ANALYTICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          label="Total Revenue"
          value={`₹${analytics.totalRevenue.toFixed(0)}`}
          sub={`Today ₹${analytics.todayRevenue.toFixed(0)} · Week ₹${analytics.weekRevenue.toFixed(0)} · Month ₹${analytics.monthRevenue.toFixed(0)}`}
          icon="💰"
        />
        <AnalyticsCard
          label="Pending Payout"
          value={b ? `₹${b.availableBalance.toFixed(0)}` : "N/A"}
          sub={b ? "Unsettled, available to withdraw" : "Loading…"}
          icon="🏦"
        />
        <AnalyticsCard
          label="Acceptance Rate"
          value={analytics.acceptanceRate != null ? `${analytics.acceptanceRate.toFixed(0)}%` : "N/A"}
          sub="Accepted ÷ decided orders"
          icon="✅"
        />
        <AnalyticsCard
          label="Last 7 Days Revenue"
          value={`₹${analytics.last7Revenue.toFixed(0)}`}
          sub={
            analytics.trendPct == null
              ? "No prior-week data yet"
              : `${analytics.trendPct >= 0 ? "▲" : "▼"} ${Math.abs(analytics.trendPct).toFixed(0)}% vs prior 7 days`
          }
          icon="📈"
          accentSub={analytics.trendPct != null}
          positive={(analytics.trendPct ?? 0) >= 0}
        />
      </section>

      {/* REVENUE GRAPH */}
      <section className="d3-card p-5">
        <h2 className="font-bold mb-1 text-sm">Revenue Overview</h2>
        <p className="text-xs opacity-60 mb-3">Last 7 days, from delivered orders.</p>
        <RevenueChart days={analytics.dailyRevenue} />
      </section>

      {/* LIVE ORDERS */}
      <section className="d3-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Manage Live Orders</h2>
          <span className="text-xs opacity-60">{liveActionable.length} needing action</span>
        </div>
        {error && (
          <div className="text-xs text-red-500 flex items-center justify-between mb-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline opacity-70">Dismiss</button>
          </div>
        )}
        {liveActionable.length === 0 ? (
          <p className="text-sm opacity-60 text-center py-6">No orders need your attention right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveActionable.map((o) => (
              <div key={o.id} className="d3-card d3-card-hover p-3.5 text-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold">#{o.id.slice(0, 8)}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full glass-card">{o.status.replace(/_/g, " ")}</span>
                </div>
                <div className="text-xs opacity-60 mb-2">
                  {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · ₹{o.grandTotal.toFixed(0)}
                </div>
                <div className="flex gap-2">
                  {(ACTION_LABEL[o.status as OrderStatus] ?? []).map((a) => (
                    <button
                      key={a.next}
                      onClick={() => advance(o.id, a.next)}
                      disabled={advancingIds.has(o.id)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs disabled:opacity-50 ${a.next === OrderStatus.CANCELLED ? "d3-card text-red-500" : "d3-btn portal-btn-primary"}`}
                      style={{ minHeight: 36 }}
                    >
                      {advancingIds.has(o.id) ? "..." : a.label}
                    </button>
                  ))}
                  {o.status === OrderStatus.READY_FOR_PICKUP && (
                    <Link
                      href="/restaurant/kitchen"
                      className="flex-1 d3-card px-2 py-1.5 rounded-lg text-xs text-center"
                      style={{ minHeight: 36 }}
                    >
                      Generate OTP
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RECENT ORDERS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Recent Orders</h2>
          <Link href="/restaurant/orders" className="text-xs underline opacity-70">
            View All Orders
          </Link>
        </div>
        <div className="space-y-2">
          {recent.map((o) => (
            <Link
              key={o.id}
              href="/restaurant/orders"
              className="d3-card d3-card-hover p-3.5 flex items-center justify-between text-sm block"
            >
              <div>
                <div className="font-semibold">#{o.id.slice(0, 8)}</div>
                <div className="text-xs opacity-60">
                  {new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {o.paymentMethod}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{o.grandTotal.toFixed(0)}</div>
                <div className="text-[10px] opacity-60">{o.status.replace(/_/g, " ")}</div>
              </div>
            </Link>
          ))}
          {recent.length === 0 && <p className="opacity-60 text-sm">No orders yet.</p>}
        </div>
      </section>

      {/* OPERATIONS */}
      <section>
        <h2 className="font-bold text-sm mb-3">Operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/restaurant/kitchen" icon="🔥" label="Open Kitchen" sub={`${analytics.newCount} new · ${analytics.preparingCount} preparing · ${analytics.readyCount} ready`} />
          <QuickAction href="/restaurant/hours" icon="🕒" label="Hours & Holidays" />
          <QuickAction href="/restaurant/menu/categories" icon="📂" label="Categories" />
          <QuickAction href="/restaurant/offers" icon="🏷" label="Offers & Coupons" />
        </div>
      </section>

      {/* BUSINESS */}
      <section>
        <h2 className="font-bold text-sm mb-3">Business</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/restaurant/reviews" icon="⭐" label="Reviews" />
          <QuickAction href="/restaurant/staff" icon="👥" label="Staff" />
          <QuickAction href="/restaurant/finance" icon="💰" label="Settlements" />
          <QuickAction href="/restaurant/menu" icon="🍽" label="Manage Menu" />
          <QuickAction href="/restaurant/photos" icon="📷" label="Restaurant Photos" />
          <a
            href={`/customer/restaurants/${active.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="d3-card d3-card-hover p-4 text-center"
            style={{ minHeight: 44 }}
          >
            <div className="text-xl mb-1">👁</div>
            <div className="text-xs font-semibold">Customer View</div>
          </a>
        </div>
      </section>

      {/* ACTIVE DELIVERY */}
      {deliveries.length > 0 && (
        <section className="d3-card p-5">
          <h2 className="font-bold text-sm mb-3">Active Deliveries</h2>
          <div className="space-y-2">
            {deliveries.map((d) => (
              <div key={d.id} className="d3-card p-3.5 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">#{d.orderId.slice(0, 8)}</div>
                  <div className="text-xs opacity-60">{d.driver?.name ?? "Awaiting driver"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{d.stage.replace(/_/g, " ")}</div>
                  {d.driver?.locationUpdatedAt && (
                    <div className="text-[10px] opacity-50">
                      Updated {new Date(d.driver.locationUpdatedAt).toLocaleTimeString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  sub,
  icon,
  accentSub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  accentSub?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="d3-card d3-card-hover p-4">
      <div className="d3-icon-badge mb-2">{icon}</div>
      <div className="text-xs opacity-60 mb-0.5">{label}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div
        className="text-[11px]"
        style={accentSub ? { color: positive ? "var(--qb-success)" : "var(--qb-error)" } : { opacity: 0.6 }}
      >
        {sub}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, sub }: { href: string; icon: string; label: string; sub?: string }) {
  return (
    <Link href={href} className="d3-card d3-card-hover p-4 text-center block" style={{ minHeight: 44 }}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs font-semibold">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-1">{sub}</div>}
    </Link>
  );
}
