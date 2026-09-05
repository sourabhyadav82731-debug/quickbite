"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number) {
  return `₹${Number(n ?? 0).toFixed(2)}`;
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const userId = params?.userId as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-driver-detail", userId],
    queryFn: () => api.admin.driverDetail(userId),
    enabled: !!userId,
  });
  const d = data as any;

  async function suspend() {
    if (!confirm("Suspend this driver's account?")) return;
    await api.admin.suspendUser(userId);
    qc.invalidateQueries({ queryKey: ["admin-driver-detail", userId] });
  }
  async function activate() {
    await api.admin.activateUser(userId);
    qc.invalidateQueries({ queryKey: ["admin-driver-detail", userId] });
  }

  if (isLoading) return <p className="text-sm opacity-60">Loading…</p>;
  if (!d) return <p className="text-sm opacity-60">Driver not found.</p>;

  const { profile, user, tripHistory, earnings, payouts, reviews } = d;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => router.back()} className="text-xs opacity-60 mb-1">← Back</button>
          <h1 className="text-xl font-bold">{user?.name ?? "Driver"}</h1>
          <p className="text-xs opacity-60">{user?.phone} · {user?.email}</p>
        </div>
        {user?.isActive ? (
          <button onClick={suspend} className="qb-admin-badge qb-admin-badge-error px-3 py-1.5">Suspend</button>
        ) : (
          <button onClick={activate} className="qb-admin-badge qb-admin-badge-success px-3 py-1.5">Activate</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Vehicle" value={`${profile.vehicleType} · ${profile.vehicleNumber}`} />
        <Kpi label="Rating" value={`★ ${Number(profile.rating).toFixed(1)}`} />
        <Kpi label="Acceptance Rate" value={`${profile.acceptanceRate}%`} />
        <Kpi label="On-Time Rate" value={`${profile.onTimeRate}%`} />
        <Kpi label="Total Earnings" value={money(earnings.totalEarnings)} accent="primary" />
        <Kpi label="Pending Payout" value={money(earnings.pendingPayout)} accent="warning" />
        <Kpi label="Status" value={profile.isOnline ? "Online" : "Offline"} accent={profile.isOnline ? "success" : undefined} />
      </div>

      <Section title="Trip History">
        <div className="qb-admin-table-wrap">
          <table className="qb-admin-table">
            <thead><tr><th>Order</th><th>Stage</th><th>Earnings</th><th>Date</th></tr></thead>
            <tbody>
              {tripHistory.slice(0, 30).map((t: any) => (
                <tr key={t.id} style={{ cursor: "default" }}>
                  <td className="font-mono text-xs">#{t.orderId.slice(0, 8)}</td>
                  <td>{t.stage}</td>
                  <td>{money(t.basePay + t.distancePay + t.surgeBonus + t.tip)}</td>
                  <td className="text-xs opacity-70">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tripHistory.length === 0 && <p className="opacity-60 text-sm p-4">No trips yet.</p>}
        </div>
      </Section>

      <Section title="Payouts">
        {payouts.length === 0 ? (
          <p className="text-xs opacity-60">No payout requests yet.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p: any) => (
              <div key={p.id} className="glass-card p-3 text-sm flex justify-between">
                <span>{money(p.amount)} · {p.payoutMethod}</span>
                <span className="qb-admin-badge">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Reviews">
        {reviews.length === 0 ? (
          <p className="text-xs opacity-60">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {reviews.slice(0, 10).map((r: any) => (
              <div key={r.id} className="glass-card p-3 text-sm">
                ★ {r.deliveryRating ?? "—"} {r.comment && <span className="opacity-70">— {r.comment}</span>}
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

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "warning" }) {
  const color = accent ? { primary: "var(--qb-primary)", success: "#6FAE7F", warning: "#A67C00" }[accent] : undefined;
  return (
    <div className="qb-admin-kpi-card">
      <div className="qb-admin-kpi-label">{label}</div>
      <div className="qb-admin-kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
