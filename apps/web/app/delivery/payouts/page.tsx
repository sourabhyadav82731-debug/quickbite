"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, apiClient } from "@/lib/api";
import { WithdrawalModal, WithdrawalHistoryList } from "@/components/withdrawal-modal";

export default function WalletPage() {
  const qc = useQueryClient();
  // Reuses the exact same backend truth as the dashboard/trips pages — no
  // separate earnings ledger exists, so these numbers are derived from the
  // same accumulated per-delivery earnings (basePay+distancePay+surgeBonus+tip)
  // that already power everything else. Available balance additionally
  // subtracts anything already reserved by a PENDING/PROCESSING withdrawal —
  // WithdrawalsService computes it server-side; this is a read of that, never
  // a client-side calculation of its own.
  const { data: balance } = useQuery({
    queryKey: ["driver-wallet-balance"],
    queryFn: () => api.withdrawals.driverBalance(),
  });
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const { data: history } = useQuery({
    queryKey: ["driver-history"],
    queryFn: () => apiClient.get<any[]>("/deliveries/history"),
  });
  const { data: withdrawalHistory } = useQuery({
    queryKey: ["driver-withdrawal-history"],
    queryFn: () => api.withdrawals.driverHistory(),
  });
  const [showWithdraw, setShowWithdraw] = useState(false);

  const b = balance as any;
  const available = b?.availableBalance ?? 0;
  const cod = (profile as any)?.codCashInHand ?? 0;
  const trips = (history as any[]) ?? [];

  async function requestWithdrawal(amount: number, payoutMethod: string) {
    await api.withdrawals.requestDriverWithdrawal(amount, payoutMethod);
    qc.invalidateQueries({ queryKey: ["driver-wallet-balance"] });
    qc.invalidateQueries({ queryKey: ["driver-withdrawal-history"] });
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm opacity-60">Earnings from your completed deliveries.</p>
      </div>

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

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Total Earnings" value={b?.totalEarnings ?? 0} />
        <MiniStat label="Today" value={b?.todayEarnings ?? 0} />
        <MiniStat label="This Week" value={b?.weekEarnings ?? 0} />
      </div>

      {showWithdraw && (
        <WithdrawalModal
          availableBalance={available}
          onClose={() => setShowWithdraw(false)}
          onSubmit={requestWithdrawal}
        />
      )}

      <div className="d3-card p-4 flex items-center justify-between">
        <span className="text-sm font-medium">COD Cash in Hand</span>
        <span className="font-bold" style={{ color: cod > 2000 ? "#e74040" : "var(--portal-primary)" }}>
          ₹{cod.toFixed(2)}
        </span>
      </div>
      {cod > 2000 && (
        <p className="text-xs text-red-500 -mt-2">
          You're above the recommended COD limit — please deposit cash soon.
        </p>
      )}

      <div>
        <h2 className="font-semibold text-sm mb-2">Withdrawal History</h2>
        <WithdrawalHistoryList history={(withdrawalHistory as any[]) ?? []} />
      </div>

      <div>
        <h2 className="font-semibold text-sm mb-2">Transaction History</h2>
        {trips.length === 0 ? (
          <div className="d3-card p-6 text-center opacity-60 text-sm">No earnings yet.</div>
        ) : (
          <div className="space-y-2">
            {trips.map((d) => (
              <div key={d.id} className="d3-card p-3.5 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">Order #{d.orderId.slice(0, 8)}</div>
                  <div className="text-xs opacity-60">{d.restaurantName ?? "Restaurant"}</div>
                  <div className="text-[10px] opacity-50 mt-0.5">
                    {new Date(d.updatedAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: "var(--portal-primary)" }}>
                    + ₹{d.earning.toFixed(0)}
                  </div>
                  <div className="text-[10px] opacity-60">Completed</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="d3-card p-3 text-center">
      <div className="text-[10px] opacity-60 mb-0.5">{label}</div>
      <div className="font-bold text-sm">₹{value.toFixed(0)}</div>
    </div>
  );
}
