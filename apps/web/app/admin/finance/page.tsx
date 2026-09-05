"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, friendlyErrorMessage } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--qb-warning)",
  PROCESSING: "var(--qb-primary)",
  COMPLETED: "var(--qb-success)",
  FAILED: "var(--qb-error)",
};

export default function AdminFinancePage() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api.admin.dashboard() });
  const d = data as any;
  const qc = useQueryClient();
  const { data: withdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => api.withdrawals.adminList(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = (withdrawals as any[]) ?? [];

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      if (status === "FAILED") {
        const reason = window.prompt("Reason for marking this withdrawal FAILED:");
        if (!reason) {
          setBusyId(null);
          return;
        }
        await api.withdrawals.adminUpdateStatus(id, status, undefined, reason);
      } else if (status === "COMPLETED") {
        const reference = window.prompt("Reference/transaction ID for this completed transfer:") ?? undefined;
        await api.withdrawals.adminUpdateStatus(id, status, reference);
      } else {
        await api.withdrawals.adminUpdateStatus(id, status);
      }
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to update withdrawal"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Financial Settlements & Tax Engine</h1>
      {d && (
        <div className="glass-card p-5 space-y-2 text-sm">
          <div className="flex justify-between"><span>Total Revenue</span><span>₹{d.kpis.totalRevenue.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Platform Revenue</span><span>₹{d.financials.platformRevenue.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivered Orders</span><span>{d.kpis.completedOrders}</span></div>
        </div>
      )}
      <p className="text-xs opacity-60">
        Automated weekly batch payouts and downloadable GST reports are planned for a future
        pass — restaurant-level commission math is live under each restaurant's Finance page.
      </p>

      <div>
        <h2 className="font-semibold text-sm mb-2">Withdrawal Requests</h2>
        <p className="text-xs opacity-60 mb-2">
          No payout provider is wired into this build — a withdrawal only moves to Completed once
          you've actually sent the transfer yourself and confirm it here with a reference id.
        </p>
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {list.length === 0 ? (
          <div className="d3-card p-6 text-center opacity-60 text-sm">No withdrawal requests yet.</div>
        ) : (
          <div className="space-y-2">
            {list.map((w) => (
              <div key={w.id} className="d3-card p-3.5 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">₹{w.amount.toFixed(2)}</div>
                    <div className="text-xs opacity-60">
                      {w.ownerType} · {w.ownerId.slice(0, 8)} · {w.payoutMethod}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: `${STATUS_COLOR[w.status]}22`, color: STATUS_COLOR[w.status] }}
                  >
                    {w.status}
                  </span>
                </div>
                {(w.status === "PENDING" || w.status === "PROCESSING") && (
                  <div className="flex gap-2">
                    {w.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(w.id, "PROCESSING")}
                        disabled={busyId === w.id}
                        className="qb-btn-secondary text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        Mark Processing
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(w.id, "COMPLETED")}
                      disabled={busyId === w.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                      style={{ background: "var(--qb-success)", color: "#171313" }}
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateStatus(w.id, "FAILED")}
                      disabled={busyId === w.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                      style={{ background: "var(--qb-error)22", color: "var(--qb-error)" }}
                    >
                      Mark Failed
                    </button>
                  </div>
                )}
                {w.referenceId && <div className="text-[10px] opacity-50">Ref: {w.referenceId}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
