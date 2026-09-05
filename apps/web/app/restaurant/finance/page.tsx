"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, apiClient } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { WithdrawalModal, WithdrawalHistoryList } from "@/components/withdrawal-modal";

export default function FinancePage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["payouts", active?.id],
    queryFn: () => apiClient.get<any>(`/payouts/restaurant?restaurantId=${active.id}`),
    enabled: !!active,
  });
  const { data: balance } = useQuery({
    queryKey: ["restaurant-wallet-balance", active?.id],
    queryFn: () => api.withdrawals.restaurantBalance(active.id),
    enabled: !!active,
  });
  const { data: withdrawalHistory } = useQuery({
    queryKey: ["restaurant-withdrawal-history", active?.id],
    queryFn: () => api.withdrawals.restaurantHistory(active.id),
    enabled: !!active,
  });
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;
  const payout = data as any;
  const b = balance as any;
  const available = b?.availableBalance ?? 0;

  async function requestWithdrawal(amount: number, payoutMethod: string) {
    await api.withdrawals.requestRestaurantWithdrawal(active.id, amount, payoutMethod);
    qc.invalidateQueries({ queryKey: ["restaurant-wallet-balance", active.id] });
    qc.invalidateQueries({ queryKey: ["restaurant-withdrawal-history", active.id] });
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Financial Settlement</h1>

      <div className="d3-hero p-6">
        <div className="text-xs opacity-80 mb-1">Available Balance</div>
        <div className="text-4xl font-bold mb-4">₹{available.toFixed(2)}</div>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={available <= 0}
          className="d3-btn bg-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
          style={{ color: "var(--portal-primary)" }}
        >
          Withdraw Earnings
        </button>
      </div>

      {payout && (
        <div className="glass-card p-5 space-y-2 text-sm">
          <Row label="Orders Settled (Delivered)" value={payout.ordersSettled} />
          <Row label="Gross Sales" value={`₹${payout.grossSales.toFixed(2)}`} />
          <Row label="Commission Rate" value={`${(payout.commissionRate * 100).toFixed(0)}%`} />
          <Row label="Commission Deducted" value={`₹${payout.commissionDeducted.toFixed(2)}`} />
          <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: "var(--portal-border)" }}>
            <span>Net Payout</span>
            <span>₹{payout.netPayout.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-sm mb-2">Withdrawal History</h2>
        <WithdrawalHistoryList history={(withdrawalHistory as any[]) ?? []} />
      </div>

      <p className="text-xs opacity-60">
        Bank settlement scheduling and downloadable tax invoices are planned for a future pass —
        this is a live computed ledger from delivered orders.
      </p>

      {showWithdraw && (
        <WithdrawalModal
          availableBalance={available}
          onClose={() => setShowWithdraw(false)}
          onSubmit={requestWithdrawal}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between opacity-80">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
