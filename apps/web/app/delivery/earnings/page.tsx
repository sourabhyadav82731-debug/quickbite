"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function EarningsPage() {
  const { data } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });
  const e = data as any;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Earnings</h1>
      {e && (
        <div className="glass-card p-5 space-y-2 text-sm">
          <Row label="Base Pay" value={e.base} />
          <Row label="Distance Pay (₹8/km)" value={e.distance} />
          <Row label="Peak Surge Bonus" value={e.surge} />
          <Row label="Customer Tips (100%)" value={e.tips} />
          <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: "var(--portal-border)" }}>
            <span>Total ({e.tripsCompleted} trips)</span>
            <span>₹{e.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between opacity-80">
      <span>{label}</span>
      <span>₹{value.toFixed(2)}</span>
    </div>
  );
}
