"use client";

import { DAILY_INCENTIVE_TIERS } from "@quickbite/config";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function IncentivesPage() {
  const { data } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });
  const completed = (data as any)?.tripsCompleted ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Milestone Incentives</h1>
      <div className="space-y-3">
        {DAILY_INCENTIVE_TIERS.map((tier) => {
          const pct = Math.min(100, (completed / tier.orders) * 100);
          return (
            <div key={tier.orders} className="glass-card p-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Complete {tier.orders} orders</span>
                <span className="font-bold">+₹{tier.bonus}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--portal-border)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${pct}%`, background: "var(--portal-primary)" }}
                />
              </div>
              <div className="text-xs opacity-60 mt-1">{completed}/{tier.orders} orders today</div>
            </div>
          );
        })}
      </div>
      <div className="glass-card p-4 text-sm opacity-70">
        Weekend streak multipliers and rain surge bonuses apply automatically during active surge
        windows.
      </div>
    </div>
  );
}
