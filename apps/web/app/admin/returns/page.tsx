"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STATUSES = ["ALL", "REQUESTED", "APPROVED", "REJECTED", "PROCESSING", "REFUNDED"];

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "qb-admin-badge-info",
  APPROVED: "qb-admin-badge-primary",
  REJECTED: "qb-admin-badge-error",
  PROCESSING: "qb-admin-badge-warning",
  REFUNDED: "qb-admin-badge-success",
};

function money(n: number) {
  return `₹${Number(n).toFixed(2)}`;
}

export default function ReturnsRefundsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [processNote, setProcessNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const query = status === "ALL" ? "" : `?status=${status}`;
  const { data, isLoading } = useQuery({
    queryKey: ["admin-refunds", status],
    queryFn: () => api.admin.refunds(query),
  });
  const refunds = (data as any[]) ?? [];

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-refunds"] });
  }

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.admin.approveRefund(id);
      invalidate();
    } catch (err: any) {
      setError(err?.message ?? "Could not approve refund.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!rejectNote.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      await api.admin.rejectRefund(id, rejectNote.trim());
      setRejectNote("");
      setExpanded(null);
      invalidate();
    } catch (err: any) {
      setError(err?.message ?? "Could not reject refund.");
    } finally {
      setBusyId(null);
    }
  }

  async function process(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.admin.processRefund(id, processNote.trim() || undefined);
      setProcessNote("");
      setExpanded(null);
      invalidate();
    } catch (err: any) {
      setError(err?.message ?? "Could not process refund.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Returns &amp; Refunds</h1>
      <p className="text-xs opacity-60">
        Every refund here is backed by a real Razorpay refund for online payments, or an admin-recorded
        cash settlement note for Cash on Delivery orders — never a fake success state.
      </p>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`qb-admin-badge px-3 py-1.5 ${status === s ? "qb-admin-badge-primary" : ""}`}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {error && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{error}</p>}

      <div className="space-y-3">
        {refunds.map((r: any) => (
          <div key={r.id} className="qb-admin-kpi-card space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Link href={`/admin/orders/${r.orderId}`} className="font-mono text-xs opacity-70 hover:underline">
                  Order #{r.orderId.slice(0, 8)}
                </Link>
                <div className="font-bold text-lg">{money(r.refundAmount)}</div>
              </div>
              <span className={`qb-admin-badge ${STATUS_BADGE[r.status] ?? ""}`}>{r.status}</span>
            </div>
            <div className="text-sm opacity-80">{r.reason}</div>
            <div className="text-xs opacity-60 grid sm:grid-cols-2 gap-1">
              <span>Order Amount: {money(r.orderAmount)}</span>
              <span>Requested: {new Date(r.requestedAt).toLocaleString()}</span>
              {r.processedAt && <span>Processed: {new Date(r.processedAt).toLocaleString()}</span>}
              {r.razorpayRefundId && <span className="font-mono">Razorpay Refund: {r.razorpayRefundId}</span>}
              {r.adminNote && <span className="sm:col-span-2">Admin note: {r.adminNote}</span>}
            </div>

            {r.status === "REQUESTED" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => approve(r.id)}
                  disabled={busyId === r.id}
                  className="portal-btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="glass-card px-3 py-1.5 text-xs"
                >
                  Reject
                </button>
              </div>
            )}
            {r.status === "REQUESTED" && expanded === r.id && (
              <div className="flex gap-2 pt-1">
                <input
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Reason for rejection"
                  className="glass-card px-3 py-1.5 text-xs flex-1"
                />
                <button
                  onClick={() => reject(r.id)}
                  disabled={busyId === r.id || !rejectNote.trim()}
                  className="portal-btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                  style={{ background: "var(--qb-error)" }}
                >
                  Confirm Reject
                </button>
              </div>
            )}

            {r.status === "APPROVED" && (
              <div className="space-y-2 pt-1">
                <input
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  placeholder="Admin note (e.g. how COD cash was returned) — optional for online payments"
                  className="glass-card px-3 py-1.5 text-xs w-full"
                />
                <button
                  onClick={() => process(r.id)}
                  disabled={busyId === r.id}
                  className="portal-btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {busyId === r.id ? "Processing…" : "Process Refund"}
                </button>
              </div>
            )}
          </div>
        ))}
        {!isLoading && refunds.length === 0 && (
          <p className="opacity-60 text-sm">No refunds match this filter.</p>
        )}
      </div>
    </div>
  );
}
