"use client";

import { useState } from "react";
import { friendlyErrorMessage } from "@/lib/api";

/** Shared by both the driver and restaurant wallet pages — the request itself
 *  (amount + payout method) always goes to the backend for the real check;
 *  `availableBalance` here is only ever a preview shown to the person typing,
 *  never trusted as the actual limit (WithdrawalsService recomputes it
 *  server-side from the same source this modal's balance came from). */
export function WithdrawalModal({
  availableBalance,
  onClose,
  onSubmit,
}: {
  availableBalance: number;
  onClose: () => void;
  onSubmit: (amount: number, payoutMethod: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = Number(amount);
    if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid withdrawal amount");
      return;
    }
    if (parsed > availableBalance) {
      setError("Amount exceeds your available balance");
      return;
    }
    if (!payoutMethod.trim()) {
      setError("Enter where this should be paid out (UPI ID / bank account)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(parsed, payoutMethod.trim());
      onClose();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to request withdrawal"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-sm p-5 space-y-3 rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg">Withdraw Earnings</h2>

        <div className="flex justify-between text-sm py-2 border-b" style={{ borderColor: "var(--qb-border)" }}>
          <span className="opacity-70">Available Balance</span>
          <span className="font-bold">₹{availableBalance.toFixed(2)}</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs opacity-70">Withdrawal Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full glass-card px-3 py-2.5 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs opacity-70">Payout Method (UPI ID / bank account)</label>
          <input
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
            placeholder="e.g. yourname@upi"
            className="w-full glass-card px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 qb-btn-secondary py-2.5 text-sm rounded-xl"
            style={{ minHeight: 44 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 portal-btn-primary py-2.5 text-sm rounded-xl disabled:opacity-50"
            style={{ minHeight: 44 }}
          >
            {submitting ? "Requesting…" : "Request Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--qb-warning)",
  PROCESSING: "var(--qb-primary)",
  COMPLETED: "var(--qb-success)",
  FAILED: "var(--qb-error)",
};

export function WithdrawalHistoryList({ history }: { history: any[] }) {
  if (history.length === 0) {
    return <div className="d3-card p-6 text-center opacity-60 text-sm">No withdrawals yet.</div>;
  }
  return (
    <div className="space-y-2">
      {history.map((w) => (
        <div key={w.id} className="d3-card p-3.5 flex items-center justify-between text-sm">
          <div>
            <div className="font-bold">₹{w.amount.toFixed(2)}</div>
            <div className="text-xs opacity-60">
              {new Date(w.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            {w.referenceId && <div className="text-[10px] opacity-50 mt-0.5">Ref: {w.referenceId}</div>}
            {w.status === "FAILED" && w.failureReason && (
              <div className="text-[10px] mt-0.5" style={{ color: "var(--qb-error)" }}>
                {w.failureReason}
              </div>
            )}
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${STATUS_COLOR[w.status]}22`, color: STATUS_COLOR[w.status] }}
          >
            {w.status}
          </span>
        </div>
      ))}
    </div>
  );
}
