"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function FinancePage() {
  const { active } = useRestaurant();
  const { data } = useQuery({
    queryKey: ["payouts", active?.id],
    queryFn: () => apiClient.get<any>(`/payouts/restaurant?restaurantId=${active.id}`),
    enabled: !!active,
  });

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;
  const payout = data as any;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Financial Settlement</h1>
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
      <p className="text-xs opacity-60">
        Bank settlement scheduling and downloadable tax invoices are planned for a future pass —
        this is a live computed ledger from delivered orders.
      </p>
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
