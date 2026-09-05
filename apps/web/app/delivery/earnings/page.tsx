"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function EarningsPage() {
  const { data } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });
  const e = data as any;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Earnings Summary</h1>
        <p className="text-sm opacity-60">Real totals from your own completed trips.</p>
      </div>

      {e && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SummaryCard label="Today" value={e.todayEarnings} sub={`${e.todayTrips} trips`} />
            <SummaryCard label="This Week" value={e.weekEarnings} sub={`${e.weekTrips} trips`} />
            <SummaryCard label="This Month" value={e.monthEarnings} sub={`${e.monthTrips} trips`} />
          </div>

          <div className="d3-hero p-6">
            <div className="text-xs opacity-80 mb-1">Total Earnings</div>
            <div className="text-4xl font-bold mb-1">₹{e.total.toFixed(0)}</div>
            <div className="text-xs opacity-80">{e.tripsCompleted} completed trips all-time</div>
          </div>

          <div className="glass-card p-5 space-y-2 text-sm">
            <h2 className="font-semibold mb-1 text-sm">Breakdown (all-time)</h2>
            <Row label="Base Pay" value={e.base} />
            <Row label="Distance Pay (₹8/km)" value={e.distance} />
            <Row label="Peak Surge Bonus" value={e.surge} />
            <Row label="Customer Tips (100%)" value={e.tips} />
            <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: "var(--portal-border)" }}>
              <span>Total ({e.tripsCompleted} trips)</span>
              <span>₹{e.total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="d3-card d3-card-hover p-4">
      <div className="text-xs opacity-60 mb-0.5">{label}</div>
      <div className="text-xl font-bold" style={{ color: "var(--portal-primary)" }}>
        ₹{value.toFixed(0)}
      </div>
      <div className="text-[11px] opacity-50 mt-0.5">{sub}</div>
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
