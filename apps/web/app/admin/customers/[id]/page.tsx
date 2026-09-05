"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number) {
  return `₹${Number(n ?? 0).toFixed(2)}`;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params?.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer-detail", id],
    queryFn: () => api.admin.customerDetail(id),
    enabled: !!id,
  });
  const d = data as any;

  async function suspend() {
    if (!confirm("Suspend this customer's account?")) return;
    await api.admin.suspendUser(id);
    qc.invalidateQueries({ queryKey: ["admin-customer-detail", id] });
  }
  async function activate() {
    await api.admin.activateUser(id);
    qc.invalidateQueries({ queryKey: ["admin-customer-detail", id] });
  }

  if (isLoading) return <p className="text-sm opacity-60">Loading…</p>;
  if (!d) return <p className="text-sm opacity-60">Customer not found.</p>;

  const { customer, orderHistory, paymentHistory, refundHistory, reviews } = d;
  const totalSpent = orderHistory
    .filter((o: any) => o.status === "DELIVERED")
    .reduce((s: number, o: any) => s + o.grandTotal, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => router.back()} className="text-xs opacity-60 mb-1">← Back</button>
          <h1 className="text-xl font-bold">{customer.name}</h1>
          <p className="text-xs opacity-60">{customer.email} · {customer.phone ?? "—"}</p>
        </div>
        {customer.isActive ? (
          <button onClick={suspend} className="qb-admin-badge qb-admin-badge-error px-3 py-1.5">Suspend</button>
        ) : (
          <button onClick={activate} className="qb-admin-badge qb-admin-badge-success px-3 py-1.5">Activate</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total Orders" value={orderHistory.length} />
        <Kpi label="Total Spent" value={money(totalSpent)} accent="primary" />
        <Kpi label="Wallet Balance" value={money(customer.walletBalance)} />
        <Kpi label="Account Status" value={customer.isActive ? "Active" : "Suspended"} accent={customer.isActive ? "success" : "error"} />
      </div>

      <Section title="Order History">
        <div className="qb-admin-table-wrap">
          <table className="qb-admin-table">
            <thead><tr><th>Order</th><th>Status</th><th>Value</th><th>Date</th></tr></thead>
            <tbody>
              {orderHistory.slice(0, 30).map((o: any) => (
                <tr key={o.id} onClick={() => (window.location.href = `/admin/orders/${o.id}`)}>
                  <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td>{o.status.replace(/_/g, " ")}</td>
                  <td>{money(o.grandTotal)}</td>
                  <td className="text-xs opacity-70">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orderHistory.length === 0 && <p className="opacity-60 text-sm p-4">No orders yet.</p>}
        </div>
      </Section>

      <Section title="Payment History">
        {paymentHistory.length === 0 ? (
          <p className="text-xs opacity-60">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {paymentHistory.slice(0, 15).map((p: any) => (
              <div key={p.id} className="glass-card p-3 text-sm flex justify-between">
                <span>{p.method} · {money(p.amount)}</span>
                <span className="qb-admin-badge">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Refund History">
        {refundHistory.length === 0 ? (
          <p className="text-xs opacity-60">No refunds filed.</p>
        ) : (
          <div className="space-y-2">
            {refundHistory.map((r: any) => (
              <div key={r.id} className="glass-card p-3 text-sm flex justify-between">
                <span>{money(r.refundAmount)} — {r.reason}</span>
                <span className="qb-admin-badge">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Reviews">
        {reviews.length === 0 ? (
          <p className="text-xs opacity-60">No reviews written yet.</p>
        ) : (
          <div className="space-y-2">
            {reviews.slice(0, 10).map((r: any) => (
              <div key={r.id} className="glass-card p-3 text-sm">
                ★ {r.foodRating} {r.comment && <span className="opacity-70">— {r.comment}</span>}
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

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: "primary" | "success" | "error" }) {
  const color = accent ? { primary: "var(--qb-primary)", success: "#6FAE7F", error: "#C0605F" }[accent] : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
