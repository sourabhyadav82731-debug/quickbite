"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number) {
  return `₹${Number(n ?? 0).toFixed(2)}`;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params?.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-restaurant-detail", id],
    queryFn: () => api.admin.restaurantDetail(id),
    enabled: !!id,
  });
  const d = data as any;

  async function approve() {
    await api.admin.approveRestaurant(id);
    qc.invalidateQueries({ queryKey: ["admin-restaurant-detail", id] });
  }
  async function suspend() {
    if (!confirm("Suspend this restaurant?")) return;
    await api.admin.suspendRestaurant(id);
    qc.invalidateQueries({ queryKey: ["admin-restaurant-detail", id] });
  }

  if (isLoading) return <p className="text-sm opacity-60">Loading…</p>;
  if (!d) return <p className="text-sm opacity-60">Restaurant not found.</p>;

  const { restaurant, finance, recentOrders, reviews, coupons } = d;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => router.back()} className="text-xs opacity-60 mb-1">← Back</button>
          <h1 className="text-xl font-bold">{restaurant.name}</h1>
          <p className="text-xs opacity-60">{restaurant.cuisines?.join(", ")}</p>
        </div>
        <div className="flex gap-2">
          {restaurant.status === "PENDING_APPROVAL" && (
            <button onClick={approve} className="portal-btn-primary px-3 py-1.5 text-xs">Approve</button>
          )}
          {restaurant.status !== "SUSPENDED" && (
            <button onClick={suspend} className="qb-admin-badge qb-admin-badge-error px-3 py-1.5">Suspend</button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total Sales" value={money(finance.totalSales)} />
        <Kpi label="Restaurant Food Price" value={money(finance.restaurantFoodPrice)} />
        <Kpi label="Platform Commission" value={money(finance.platformCommission)} />
        <Kpi label="Discounts" value={money(finance.discounts)} />
        <Kpi label="Refunds" value={money(finance.refunds)} accent="error" />
        <Kpi label="Net Restaurant Earnings" value={money(finance.netRestaurantEarnings)} accent="primary" />
        <Kpi label="Paid Settlements" value={money(finance.paidSettlements)} accent="success" />
        <Kpi label="Pending Settlement" value={money(finance.pendingSettlement)} accent="warning" />
      </div>

      <Section title="Coupons & Offers">
        {coupons.length === 0 ? (
          <p className="text-xs opacity-60">No coupons created by this restaurant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {coupons.map((c: any) => (
              <span key={c.id} className={`qb-admin-badge ${c.isActive ? "qb-admin-badge-success" : ""}`}>
                {c.code}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent Orders">
        <div className="qb-admin-table-wrap">
          <table className="qb-admin-table">
            <thead><tr><th>Order</th><th>Status</th><th>Value</th><th>Date</th></tr></thead>
            <tbody>
              {recentOrders.slice(0, 20).map((o: any) => (
                <tr key={o.id} onClick={() => (window.location.href = `/admin/orders/${o.id}`)}>
                  <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td>{o.status.replace(/_/g, " ")}</td>
                  <td>{money(o.grandTotal)}</td>
                  <td className="text-xs opacity-70">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && <p className="opacity-60 text-sm p-4">No orders yet.</p>}
        </div>
      </Section>

      <Section title="Reviews">
        {reviews.length === 0 ? (
          <p className="text-xs opacity-60">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {reviews.slice(0, 10).map((r: any) => (
              <div key={r.id} className="glass-card p-3 text-sm">
                <div className="flex justify-between">
                  <span>★ {r.foodRating}</span>
                  {r.isHidden && <span className="qb-admin-badge qb-admin-badge-error">Hidden</span>}
                </div>
                {r.comment && <p className="text-xs opacity-70 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="qb-admin-kpi-card">
      <h2 className="font-bold text-sm mb-3">{title.toUpperCase()}</h2>
      {children}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "warning" | "error" }) {
  const color = accent
    ? { primary: "var(--qb-primary)", success: "#6FAE7F", warning: "#A67C00", error: "#C0605F" }[accent]
    : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
