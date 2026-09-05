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

export function SettlementsView({ ownerType, title }: { ownerType: "RESTAURANT" | "DRIVER"; title: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-withdrawals"], queryFn: () => api.withdrawals.adminList() });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = ((data as any[]) ?? []).filter((w) => w.ownerType === ownerType);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      if (status === "FAILED") {
        const reason = window.prompt("Reason for marking this FAILED:");
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
      setError(friendlyErrorMessage(err, "Failed to update settlement"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-xs opacity-60">
        No payout provider is wired into this build — a request only moves to Completed once you've
        actually sent the transfer yourself and confirm it here with a reference id.
      </p>
      {error && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{error}</p>}
      {list.length === 0 ? (
        <div className="qb-admin-kpi-card p-6 text-center opacity-60 text-sm">No requests yet.</div>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="qb-admin-kpi-card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">₹{w.amount.toFixed(2)}</div>
                  <div className="text-xs opacity-60">{w.ownerId.slice(0, 8)} · {w.payoutMethod}</div>
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
                      className="qb-admin-badge qb-admin-badge-primary disabled:opacity-50"
                    >
                      Mark Processing
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(w.id, "COMPLETED")}
                    disabled={busyId === w.id}
                    className="qb-admin-badge qb-admin-badge-success disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => updateStatus(w.id, "FAILED")}
                    disabled={busyId === w.id}
                    className="qb-admin-badge qb-admin-badge-error disabled:opacity-50"
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
  );
}
